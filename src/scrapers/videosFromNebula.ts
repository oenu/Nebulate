// Scrapes api for a creator and returns an array of video objects
import mongoose from "mongoose";
import axios from "axios";
import logger from "../config/logger";

// Types
import type {
  NebulaVideoInterface,
  // NebulaVideoType,
} from "../models/nebulaVideo";

// Mongo Models
import { Creator } from "../models/creator";
import { NebulaVideo as VideoModel } from "../models/nebulaVideo";

/**
 * Scrapes api for a creator and returns an array of video objects
 * @param channel_slug - The creator's slug
 * @param onlyScrapeNew - If true, only scrape new videos
 * @param videoScrapeLimit - The number of videos to scrape
 */
export const videosFromNebula = async (
  channel_slug: string,
  onlyScrapeNew: boolean,
  videoScrapeLimit?: number
) => {
  // Default scrape limit if none is provided
  if (!videoScrapeLimit) videoScrapeLimit = 20;

  // Check if creator exists
  if (await !Creator.exists({ slug: channel_slug })) {
    throw new Error(`Scrape: Creator ${channel_slug} does not exist in DB`);
  }

  // Find creator in DB
  const creator = await Creator.findOne({ slug: channel_slug });
  if (!creator) {
    throw new Error(
      `Scrape: Creator ${channel_slug} does not have a nebula_id`
    );
  }

  // Scrape videos from Nebula
  let nebula_videos = await scrapeNebula(
    channel_slug,
    videoScrapeLimit,
    onlyScrapeNew
  );

  // Remove videos that are already in the DB
  nebula_videos = await removeNebulaDuplicates(nebula_videos);

  if (nebula_videos.length === 0) {
    logger.info(`Scrape: No new videos found for ${channel_slug}`);
    await creator.logScrape("nebula");
    return;
  }

  // Save videos to database
  logger.info(`Scrape: ${nebula_videos.length} un-scraped videos to be added`);
  await nebulaVideosToDb(nebula_videos);
  await creator.logScrape("nebula");
  return nebula_videos;
};

export const scrapeNebula = async (
  channel_slug: string,
  videoScrapeLimit: number,
  onlyScrapeNew: boolean
): Promise<NebulaVideoInterface[]> => {
  let urlBuffer = "";
  let videoBuffer = [];

  // Get the creators object id
  const creator = await Creator.findOne({ slug: channel_slug });
  if (!creator) {
    throw new Error(
      `scrapeNebula: Creator ${channel_slug} does not have a nebula_id`
    );
  }

  // Start scrape
  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    const url = `https://content.watchnebula.com/video/channels/${channel_slug}/`;
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
        logger.info(
          `Scrape: Rate limited, waiting and trying again in 1 minute`
        );
        await new Promise((resolve) => setTimeout(resolve, 60000));
        response = await axios.get(requestUrl, {
          data: {
            Authorization: `Bearer ${global.token}`,
          },
        });
      }
    }

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
        logger.info(`scrapeNebula: No new videos found for ${channel_slug}`);
        break;
      }

      // If end of new videos was reached, break the loop
      if (newVideos.length > 0 && newVideos.length < newEpisodes.length) {
        logger.info(
          `scrapeNebula: ${newVideos.length} new videos found for: ${channel_slug}`
        );
        break;
      }
      // If all videos are new, continue to the next page
      if (newVideos.length === newEpisodes.length) {
        logger.info(
          `scrapeNebula: All new videos found: ${channel_slug}, scraping again`
        );
      }
    }

    // If no next page was found, break the loop
    if (response.data.episodes.next === null) {
      logger.info("scrapeNebula: Reached end of Next-Redirects");
      break;
    }
  }
  if (videoBuffer.length === 0) {
    throw new Error(`scrapeNebula: No videos found for ${channel_slug}`);
  }

  const convertedVideos = videoBuffer.map(
    (video: any): NebulaVideoInterface => {
      return {
        nebula_video_id: video.id,
        slug: video.slug,
        title: video.title,
        short_description: video.short_description,
        duration: video.duration,
        published_at: new Date(video.published_at),
        channel_id: video.channel_id,
        channel_slug: video.channel_slug,
        channel_slugs: video.channel_slugs,
        channel_title: video.channel_title,
        share_url: video.share_url,
        matched: false,
        creator_object_id: creator._id,
      };
    }
  );
  logger.info(
    `scrapeNebula: Found ${convertedVideos.length} Nebula videos for ${channel_slug} with a limit of ${videoScrapeLimit}`
  );
  return convertedVideos;
};

export const nebulaVideosToDb = async (
  videos: Array<NebulaVideoInterface>
): Promise<void> => {
  // Save videos to database
  const videoResponse = await VideoModel.insertMany(videos);
  logger.info(`Scrape: ${videoResponse.length} videos added to database`);

  // Add video ids to creator
  if (!videoResponse[0]?.channel_slug)
    throw new Error("Scrape: Could not find creator to add nebula videos to");
  const creatorResponse = await Creator.findOneAndUpdate(
    {
      slug: videoResponse[0].channel_slug,
    },
    {
      $addToSet: {
        nebula_videos: {
          $each: [
            ...videoResponse.map(
              (video: any) => new mongoose.Types.ObjectId(video._id.toString())
            ),
          ],
        },
      },
      $set: {
        last_scraped_nebula: new Date(),
      },
    }
  );

  if (creatorResponse === null)
    throw new Error("Scrape: Could not find creator to add nebula videos to");
  else logger.info(`Scrape: ${videoResponse.length} videos added to creator`);
  return;
};

export const removeNebulaDuplicates = async (
  nebula_videos: NebulaVideoInterface[]
): Promise<NebulaVideoInterface[]> => {
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
