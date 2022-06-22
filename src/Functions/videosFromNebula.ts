// Scrapes api for a creator and returns an array of video objects

import type { NebulaVideo } from "../models/nebulaVideo";
import { NebulaVideo as VideoModel } from "../models/nebulaVideo";
import mongoose from "mongoose";
// Imports
import axios from "axios";
import logger from "../config/logger";
import { Creator } from "../models/creator";

/**
 * Scrapes api for a creator and returns an array of video objects
 * @param creatorSlug - The creator's slug
 * @param onlyScrapeNew - If true, only scrape new videos
 * @param videoScrapeLimit - The number of videos to scrape
 */
export const videosFromNebula = async (
  creatorSlug: string,
  onlyScrapeNew: boolean,
  videoScrapeLimit?: number
) => {
  if (await !Creator.exists({ slug: creatorSlug })) {
    throw new Error(`Scrape: Creator ${creatorSlug} does not exist in DB`);
  }

  let urlBuffer = "";
  let videoBuffer = [];
  logger.info(`OnlyScrapeNew: ${onlyScrapeNew}`);

  // Default scrape limit if none is provided
  if (!videoScrapeLimit) {
    videoScrapeLimit = 20;
  }

  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    try {
      const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
      const requestUrl = urlBuffer ? urlBuffer : url;

      // Get the next page of videos
      const response = await axios.get(requestUrl, {
        data: {
          Authorization: `Bearer ${global.token}`,
        },
      });

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
          logger.info(`Scrape: No new videos found for ${creatorSlug}`);
          break;
        }

        // If end of new videos was reached, break the loop
        if (newVideos.length > 0 && newVideos.length < newEpisodes.length) {
          logger.info(
            `Scrape: ${newVideos.length} new videos found for: ${creatorSlug}`
          );
          break;
        }
        // If all videos are new, continue to the next page
        if (newVideos.length === newEpisodes.length) {
          logger.info(
            `Scrape: All new videos found: ${creatorSlug}, scraping again`
          );
        }
      }

      // If no next page was found, break the loop
      if (response.data.episodes.next === null) {
        logger.info("Scrape: Reached end of Next-Redirects");
        break;
      }
    } catch (error) {
      logger.error(error);
      logger.error("Scrape: Could not scrape videos");
      throw new Error("Scrape: Could not scrape videos");
    }
  }

  console.log("Fetched: %s videos for: %s ", videoBuffer.length, creatorSlug);

  // Convert to video objects
  const convertedVideos = videoBuffer.map((video: any): NebulaVideo => {
    return {
      slug: video.slug,
      title: video.title,
      short_description: video.short_description,
      duration: video.duration,
      published_at: video.published_at,
      channel_id: video.channel_id,
      channel_slug: video.channel_slug,
      channel_slugs: video.channel_slugs,
      channel_title: video.channel_title,
      share_url: video.share_url,
      channel: video.channel,
    };
  });

  // Check if videos are already in the database
  const existingVideos = await VideoModel.find({
    slug: { $in: convertedVideos.map((video: any) => video.slug) },
  }).select("slug"); // Select() reduces the amount of data to be sent back from the database

  // If videos are already in the database, remove them from the array
  const nonConflictingVideos = convertedVideos.filter((video: any) => {
    return !existingVideos.some((existingVideo: any) => {
      return existingVideo.slug === video.slug;
    });
  });

  if (nonConflictingVideos.length === 0) {
    logger.info(`Scrape: No new videos found for ${creatorSlug}`);
    return;
  }

  logger.info(
    `Scrape: ${nonConflictingVideos.length} un-scraped videos to be added`
  );
  try {
    // Save videos to database
    const mongoResponse = await VideoModel.insertMany(nonConflictingVideos);
    logger.info(`Scrape: ${mongoResponse.length} videos added to database`);

    // Add video ids to creator
    if (mongoResponse[0]?.channel_slug) {
      try {
        await Creator.findOneAndUpdate(
          {
            slug: mongoResponse[0].channel_slug,
          },
          {
            $addToSet: {
              nebula_videos: {
                $each: [
                  ...mongoResponse.map(
                    (video: any) =>
                      new mongoose.Types.ObjectId(video._id.toString())
                  ),
                ],
              },
            },
          }
        );

        // logger.info(updateResponse);
        logger.info(`Scrape: ${mongoResponse.length} videos added to creator`);
      } catch (error) {
        logger.error(error);
        logger.error("Scrape: Could not add video ids to creator");
        throw new Error("Scrape: Could not add video ids to creator");
      }
    }
  } catch (error) {
    logger.error(error);
    logger.error("Scrape: Could not save videos");
    throw new Error("Scrape: Could not save videos");
  }

  return;
};

export default videosFromNebula;
