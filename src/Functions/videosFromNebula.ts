// Scrapes api for a creator and returns an array of video objects
import mongoose from "mongoose";
import axios from "axios";
import logger from "../config/logger";

// Types
import type { NebulaVideoType } from "../models/nebulaVideo";

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
  if (await !Creator.exists({ slug: channel_slug })) {
    throw new Error(`Scrape: Creator ${channel_slug} does not exist in DB`);
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
      const url = `https://content.watchnebula.com/video/channels/${channel_slug}/`;
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
          logger.info(`Scrape: No new videos found for ${channel_slug}`);
          break;
        }

        // If end of new videos was reached, break the loop
        if (newVideos.length > 0 && newVideos.length < newEpisodes.length) {
          logger.info(
            `Scrape: ${newVideos.length} new videos found for: ${channel_slug}`
          );
          break;
        }
        // If all videos are new, continue to the next page
        if (newVideos.length === newEpisodes.length) {
          logger.info(
            `Scrape: All new videos found: ${channel_slug}, scraping again`
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

  logger.info(
    `Scrape: Scrape found ${videoBuffer.length} Nebula videos for ${channel_slug} with a limit of ${videoScrapeLimit}`
  );

  // Convert to video objects
  const convertedVideos = videoBuffer.map((video: any): NebulaVideoType => {
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
    logger.info(`Scrape: No new videos found for ${channel_slug}`);

    try {
      // If no new videos were found, update the creator's last_scraped_nebula field
      await Creator.findOneAndUpdate(
        { slug: channel_slug },
        { $set: { last_scraped_nebula: new Date() } }
      );
      logger.info(`Scrape: Updated last_scraped_nebula for ${channel_slug}`);
    } catch {
      logger.info(
        `Scrape: Couldn't update last_scraped_nebula for ${channel_slug}`
      );
    }
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
            $set: {
              last_scraped_nebula: new Date(),
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
