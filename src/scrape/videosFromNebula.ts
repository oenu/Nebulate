// Scrapes api for a channel and returns an array of video objects
import mongoose from "mongoose";
import axios from "axios";
import logger from "../utils/logger";

// Types
import type {
  NebulaVideoInterface,
  // NebulaVideoType,
} from "../models/nebulaVideo/nebulaVideo";

// Mongo Models
import { Channel } from "../models/channel";
import { NebulaVideo as VideoModel } from "../models/nebulaVideo/nebulaVideo";

/**
 * @function videosFromNebula
 * @description Get the videos from Nebula for this channel
 * @param {string} [channelSlug] - The slug of the channel to get videos for
 * @param {boolean} [onlyScrapeNew=true] - Only scrape new videos, will stop when a video is found that is already in the DB
 * @param {number} [videoScrapeLimit=100] - The number of videos to scrape before stopping
 * @returns {NebulaVideoType[]} - Nebula videos associated with this channel
 * @async
 */
export const videosFromNebula = async (
  channelSlug: string,
  onlyScrapeNew: boolean,
  videoScrapeLimit?: number
) => {
  // Default scrape limit if none is provided
  if (!videoScrapeLimit) videoScrapeLimit = 20;

  // Check if channel exists
  if (await !Channel.exists({ slug: channelSlug })) {
    throw new Error(
      `videosFromNebula: Channel ${channelSlug} does not exist in DB`
    );
  }

  // Find channel in DB
  const channel = await Channel.findOne({ slug: channelSlug });
  if (!channel) {
    throw new Error(
      `videosFromNebula: Channel ${channelSlug} does not have a nebula_id`
    );
  }

  logger.debug(`videosFromNebula: Getting videos for ${channelSlug}`);
  // Scrape videos from Nebula
  let nebula_videos = await scrapeNebula(
    channelSlug,
    videoScrapeLimit,
    onlyScrapeNew
  );

  // Remove videos that are already in the DB
  nebula_videos = await removeNebulaDuplicates(nebula_videos);

  if (nebula_videos.length === 0) {
    logger.debug(`videosFromNebula: No new videos found for ${channelSlug}`);
    await channel.logScrape("nebula");
    return;
  }

  // Save videos to database
  logger.debug(
    `videosFromNebula: ${nebula_videos.length} un-scraped videos to be added`
  );
  await nebulaVideosToDb(nebula_videos);
  await channel.logScrape("nebula");
  return nebula_videos;
};

/**
 * @function scrapeNebula
 * @description Scrape the videos from Nebula for this channel
 * @param {string} [channelSlug] - The slug of the channel to get videos for
 * @param {number} [videoScrapeLimit=20] - The number of videos to scrape before stopping
 * @param {boolean} [onlyScrapeNew=true] - Only scrape new videos, will stop when a video is found that is already in the DB
 * @returns {NebulaVideoType[]} - Nebula videos associated with this channel
 * @throws {Error} - If the channel has no slug or mapped youtube_id
 * @async
 */
export const scrapeNebula = async (
  channelSlug: string,
  videoScrapeLimit: number,
  onlyScrapeNew: boolean
): Promise<NebulaVideoInterface[]> => {
  let urlBuffer = "";
  let videoBuffer = [];

  // Get the channels object id
  const channel = await Channel.findOne({ slug: channelSlug });
  if (!channel) {
    throw new Error(
      `scrapeNebula: Channel ${channelSlug} does not have a nebula_id`
    );
  }

  // Start scrape
  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    const url = `https://content.watchnebula.com/video/channels/${channelSlug}/`;
    const requestUrl = urlBuffer ? urlBuffer : url;

    // Get the next page of videos
    let response: any;
    try {
      response = await axios.get(requestUrl, {
        data: {
          Authorization: `Bearer ${global.token}`,
        },
      });
    } catch (error: any) {
      if (error.status === 429) {
        // If the request was rate limited, wait and try again
        logger.debug(
          `scrapeNebula: Rate limited, waiting and trying again in 1 minute`
        );
        await new Promise((resolve) => setTimeout(resolve, 60000));
        response = await axios.get(requestUrl, {
          data: {
            Authorization: `Bearer ${global.token}`,
          },
        });
      }
    }

    // Add the videos from the response to the buffer
    const newEpisodes = response.data.episodes.results;
    videoBuffer.push(...newEpisodes);
    scrapedVideos += newEpisodes.length;
    urlBuffer = response.data.episodes.next;

    // If onlyScrapeNew is true, check if the video is in the cache
    if (onlyScrapeNew === true) {
      const videoCache = await VideoModel.find({
        slug: { $in: newEpisodes.map((video: any) => video.slug) },
      }).select("slug");

      // Filter out videos that are in the cache
      const newVideos = newEpisodes.filter((video: any) => {
        return !videoCache.some((cacheVideo) => {
          return cacheVideo.slug === video.slug;
        });
      });

      // If no new videos were found, break the loop
      if (newVideos.length === 0) {
        logger.debug(`scrapeNebula: No new videos found for ${channelSlug}`);
        break;
      }

      // If end of new videos was reached, break the loop
      if (newVideos.length > 0 && newVideos.length < newEpisodes.length) {
        logger.debug(
          `scrapeNebula: ${newVideos.length} new videos found for: ${channelSlug}`
        );
        break;
      }
      // If all videos are new, continue to the next page
      if (newVideos.length === newEpisodes.length) {
        logger.debug(
          `scrapeNebula: All new videos found: ${channelSlug}, scraping again`
        );
      }
    }

    // If no next page was found, break the loop
    if (response.data.episodes.next === null) {
      logger.debug("scrapeNebula: Reached end of Next-Redirects");
      break;
    }
  }
  if (videoBuffer.length === 0) {
    throw new Error(`scrapeNebula: No videos found for ${channelSlug}`);
  }

  // Generate a list of videos to be added to the database
  const convertedVideos = videoBuffer.map(
    (video: any): NebulaVideoInterface => {
      return {
        nebulaVideoId: video.id,
        slug: video.slug,
        title: video.title,
        shortDescription: video.short_description,
        duration: video.duration,
        publishedAt: new Date(video.published_at),
        channelId: video.channel_id,
        channelSlug: video.channel_slug,
        channelSlugs: video.channel_slugs,
        channelTitle: video.channel_title,
        shareUrl: video.share_url,
        matched: false,
        channelObjectId: channel._id,
      };
    }
  );
  logger.debug(
    `scrapeNebula: Found ${convertedVideos.length} Nebula videos for ${channelSlug} with a limit of ${videoScrapeLimit}`
  );
  return convertedVideos;
};

/**
 * @function nebulaVideosToDb
 * @description Save the nebula videos to the database
 * @param {NebulaVideoType[]} nebula_videos - Nebula videos to be added to the database
 * @returns {Promise<void>} - Promise that resolves when the videos are added to the database
 * @async
 */
export const nebulaVideosToDb = async (
  videos: Array<NebulaVideoInterface>
): Promise<void> => {
  // Save videos to database
  const videoResponse = await VideoModel.insertMany(videos);
  logger.debug(
    `nebulaVideosToDb: ${videoResponse.length} videos added to database`
  );

  // Add video ids to channel
  if (!videoResponse[0]?.channelSlug)
    throw new Error(
      "nebulaVideosToDb: Could not find channel to add nebula videos to"
    );
  const channelResponse = await Channel.findOneAndUpdate(
    {
      slug: videoResponse[0].channelSlug,
    },
    {
      $addToSet: {
        nebulaVideos: {
          $each: [
            ...videoResponse.map(
              (video: any) => new mongoose.Types.ObjectId(video._id.toString())
            ),
          ],
        },
      },
      $set: {
        lastScrapedNebula: new Date(),
      },
    }
  );

  if (channelResponse === null)
    throw new Error(
      "nebulaVideosToDb: Could not find channel to add nebula videos to"
    );
  else
    logger.debug(
      `nebulaVideosToDb: ${videoResponse.length} videos added to channel`
    );
  return;
};

/**
 * @function removeNebulaDuplicates
 * @description Remove duplicate videos from an array of nebula videos by checking if the video is in the database
 * @param {NebulaVideoType[]} nebula_videos - Nebula videos to be checked for duplicates
 * @returns {NebulaVideoType[]} - Nebula videos without duplicates
 * @async
 */
export const removeNebulaDuplicates = async (
  nebula_videos: NebulaVideoInterface[]
): Promise<NebulaVideoInterface[]> => {
  console.debug("removeNebulaDuplicates: Removing duplicates");
  // Check if videos are already in the database
  const existingVideos = await VideoModel.find({
    slug: { $in: nebula_videos.map((video: any) => video.slug) },
  }).select("slug"); // Select() reduces the amount of data to be sent back from the database

  // If videos are already in the database, remove them from the array
  const nonConflictingVideos = nebula_videos.filter((video: any) => {
    return !existingVideos.some((existingVideo: any) => {
      return existingVideo.slug === video.slug;
    });
  });

  return nonConflictingVideos;
};

export default videosFromNebula;
