// Scrape youtube API to get videos for a channel
import logger from "../utils/logger";
import { youtube } from "@googleapis/youtube";
import mongoose from "mongoose";
const yt = youtube("v3");

// Types
import type {
  YoutubeVideoInterface,
  // YoutubeVideoType,
} from "../models/youtubeVideo/youtubeVideo";

// Models
import { Channel } from "../models/channel/channel";
import { YoutubeVideo as VideoModel } from "../models/youtubeVideo/youtubeVideo";

/**
 * @function videosFromYoutube
 * @description Scrape youtube API to get videos for a channel
 * @param {string} channelSlug - The channel's channel slug
 * @param {boolean} onlyScrapeNew - Only scrape new videos, will stop when a known video is found
 * @param {number} videoScrapeLimit - The number of videos to scrape
 * @returns {Promise<any[]>}  - The videos scraped from youtube
 * @throws {Error} - If the channel does not exist in the DB or if the channel does not have a youtube upload id
 * @async
 */
const videosFromYoutube = async (
  channelSlug: string,
  onlyScrapeNew: boolean,
  videoScrapeLimit?: number
): Promise<any[]> => {
  try {
    // If onlyScrapeNew is false, then we want to scrape all videos
    if (onlyScrapeNew === false) videoScrapeLimit = 2000;

    // Default scrape limit if none is provided
    if (!videoScrapeLimit) videoScrapeLimit = 20;

    // Check if channel exists
    if (await !Channel.exists({ slug: channelSlug })) {
      throw new Error(
        `videosFromYoutube: Channel ${channelSlug} does not exist in DB`
      );
    }

    // Get Channel
    const channel = await Channel.findOne({ slug: channelSlug });

    if (!channel)
      throw new Error(
        `videosFromYoutube: Channel ${channelSlug} does not have a youtube_id`
      );

    // Check if channel has a youtube upload id
    if (channel.youtubeUploadId === "" || channel.youtubeUploadId === null)
      throw new Error(
        `videosFromYoutube: Channel ${channelSlug} does not have a youtube_upload_id`
      );

    // Scrape youtube API to get videos for a channel

    let youtube_videos = await scrapeYoutube(
      channelSlug,
      videoScrapeLimit,
      onlyScrapeNew
    ).catch((err) => {
      if (err.response.status === 404) {
        logger.error(
          `videosFromYoutube: Channel ${channelSlug} either does not have any videos or the playlist id is incorrect`
        );
        return [];
      } else {
        throw err;
      }
    });

    // Remove videos that are already in the DB
    youtube_videos = await removeYoutubeDuplicates(youtube_videos);

    if (youtube_videos.length === 0) {
      logger.info(`videosFromYoutube: No new videos found for ${channelSlug}`);
      await channel.logScrape("youtube");
      return [];
    }
    logger.info(
      `videosFromYoutube: ${youtube_videos.length} new videos to be added for ${channelSlug}`
    );

    // Insert videos into DB
    await youtubeVideosToDb(youtube_videos);
    await channel.logScrape("youtube");
    logger.debug(`videosFromYoutube: ${youtube_videos.length} videos found`);
    return youtube_videos;
  } catch (err: unknown) {
    logger.error("videosFromYoutube: unknown error: " + err);
    return [];
  }
};

export default videosFromYoutube;

/**
 * @function scrapeYoutube
 * @description Scrape youtube API to get videos for a channel
 * @param {string} channelSlug - The channel's channel slug
 * @param {number} videoScrapeLimit - The number of videos to scrape
 * @param {boolean} onlyScrapeNew - Only scrape new videos, will stop when a known video is found
 * @returns {Promise<YoutubeVideo[]>} - The videos scraped from youtube
 * @throws {Error} - If the channel does not exist in the DB or if the channel does not have a youtube upload id
 * @async
 */
export const scrapeYoutube = async (
  channelSlug: string,
  videoScrapeLimit: number,
  onlyScrapeNew: boolean
): Promise<YoutubeVideoInterface[]> => {
  const videoBuffer: any = [];
  let pagetokenBuffer = "";

  // Get the channels object id
  const channel = await Channel.findOne({ slug: channelSlug });
  if (!channel) {
    throw new Error(
      `scrapeYoutube: Channel ${channelSlug} does not exist in DB`
    );
  }

  // Check if channel has a youtube upload id
  if (channel.youtubeUploadId === "" || !channel.youtubeUploadId)
    throw new Error(
      `scrapeYoutube: Channel ${channelSlug} does not have a youtube_upload_id`
    );

  logger.info(`scrapeYoutube: Getting videos from youtube for ${channelSlug}`);
  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    const pageToken = pagetokenBuffer ? pagetokenBuffer : "";

    // Get the next page of videos
    const response = await yt.playlistItems.list({
      playlistId: channel.youtubeUploadId,
      auth: process.env.YOUTUBE_API_KEY as string,
      part: ["snippet", "contentDetails", "status", "id"],
      maxResults: videoScrapeLimit,
      pageToken: pageToken,
    });

    // Check if there are any videos in the response
    if (response.data.items) {
      // Add the videos to the videoBuffer
      const newEpisodes = response.data.items;
      newEpisodes.forEach((episode) => {
        videoBuffer.push(episode);
        scrapedVideos++;
      });

      // Set the pagetokenBuffer to the next page token
      if (response.data.nextPageToken) {
        pagetokenBuffer = response?.data?.nextPageToken;
      } else {
        logger.debug("scrapeYoutube: Reached end of page tokens");
        scrapedVideos = videoScrapeLimit * 2;
      }

      // If onlyScrapeNew is true, check if the video is in the cache
      if (onlyScrapeNew === true) {
        const youtubeVideoCache = await VideoModel.find({
          slug: {
            $in: newEpisodes.map((video: any) => video.contentDetails.video_id),
          },
        }).select("videoId");

        // Filter out videos that are in the cache
        const newVideos = newEpisodes.filter((video: any) => {
          return !youtubeVideoCache.some((cacheVideo) => {
            return cacheVideo.youtubeVideoId === video.contentDetails.video_id;
          });
        });
        // If no new videos were found, break the loop
        if (newVideos.length === 0) {
          logger.debug(`scrapeYoutube: No new videos found for ${channelSlug}`);
          break;
        }

        // If end new videos was reached, break the loop
        if (newVideos.length && newVideos.length < newEpisodes.length) {
          logger.debug(
            `scrapeYoutube: End of new videos reached for ${channelSlug}`
          );
          break;
        }

        // console.log("NewVideos length: ", newVideos.length);

        // If all videos are new, continue to the next page
        if (newVideos.length === newEpisodes.length) {
          logger.debug(
            `scrapeYoutube: All new videos found: ${channelSlug}, scraping again`
          );
        }

        // If no next page token, break the loop
        if (!response.data.nextPageToken) {
          logger.debug(`scrapeYoutube: No next page token for ${channelSlug}`);
          break;
        }
      }
    }
  }

  const convertedVideos = videoBuffer.map(
    (video: any): YoutubeVideoInterface => {
      return {
        youtubeVideoId: video.contentDetails.videoId,
        publishedAt: new Date(video.contentDetails.videoPublishedAt),
        playlistId: video.snippet.playlistId,
        channelTitle: video.snippet.channelTitle,
        title: video.snippet.title,
        channelId: video.snippet.channelId,
        etag: video.etag,
        status: video.status.privacyStatus,
        channelSlug: channelSlug,
        channelObjectId: channel._id,
      };
    }
  );

  return convertedVideos;
};

/**
 * @function removeYoutubeDuplicates
 * @description Remove videos from array that are already in the DB
 * @param {YoutubeVideo[]} youtube_videos - Array of videos to remove duplicates from
 * @returns {Promise<YoutubeVideo[]>} - Array of videos with duplicates removed
 * @throws {Error} - If the channel does not exist in the DB or if the channel does not have a youtube upload id
 * @async
 */
export const removeYoutubeDuplicates = async (
  youtube_videos: YoutubeVideoInterface[]
): Promise<YoutubeVideoInterface[]> => {
  // Check for conflicting videos in the database
  const existingVideos = await VideoModel.find({
    youtubeVideoId: {
      $in: youtube_videos.map((video: any) => video.youtubeVideoId),
    },
  }).select("youtubeVideoId");

  // Remove conflicting videos from the convertedVideos array
  const nonConflictingVideos = youtube_videos.filter((video: any) => {
    return !existingVideos.some((existingVideo) => {
      return existingVideo.youtubeVideoId === video.youtubeVideoId;
    });
  });

  logger.info(
    `removeYoutubeDuplicates: ${
      youtube_videos.length - nonConflictingVideos.length
    } duplicate videos removed`
  );
  return nonConflictingVideos;
};

/**
 * @function youtubeVideosToDb
 * @description Send youtube videos to the database
 * @param {YoutubeVideo[]} youtube_videos - Array of videos to add to the database
 * @returns {Promise<void>} - Promise that resolves when the videos are added to the database
 * @throws {Error} - If the channel does not exist in the DB or if the update fails
 * @async
 */
export const youtubeVideosToDb = async (
  youtube_videos: YoutubeVideoInterface[]
): Promise<void> => {
  // Insert the nonConflictingVideos into the database
  const mongoResponse = await VideoModel.insertMany(youtube_videos);
  logger.debug(`YtScrape: ${youtube_videos.length} videos inserted`);
  // Add video ids to channel

  if (!mongoResponse[0]?.channelSlug) throw new Error("No channel slug");
  const { channelSlug } = mongoResponse[0];

  try {
    await Channel.findOneAndUpdate(
      { slug: channelSlug },
      {
        $addToSet: {
          youtubeVideos: {
            $each: [
              ...mongoResponse.map((video: any) => {
                return new mongoose.Types.ObjectId(video._id.toString());
              }),
            ],
          },
        },
      }
    );
    logger.debug(`YtScrape: Channel ${channelSlug} youtube_videos updated`);
  } catch (error) {
    logger.error(
      `YtScrape: Error updating youtube_videos for channel ${channelSlug}`
    );
  }
};
