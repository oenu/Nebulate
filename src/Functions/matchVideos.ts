import logger from "../config/logger";
import { Creator } from "../models/creator";
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";
import { YoutubeVideo as YoutubeVideos } from "../models/youtubeVideo";
import { NebulaVideo as NebulaVideos } from "../models/nebulaVideo";

/**
 * Match Nebula videos to Youtube videos, from the database
 * @param  {string} channel_slug - The channel slug
 * @param  {string} rematch_nebula_slug? - The slug of the video to rematch
 * @param  {string} rematch_yt_id? - The youtube id of the video to rematch
 */
const matchVideos = async (
  channel_slug: string,
  rematch_nebula_slug?: Array<string>,
  rematch_yt_id?: Array<string>
) => {
  logger.log(`Matching videos for ${channel_slug}`);
  console.log(rematch_nebula_slug, rematch_yt_id); // Temp

  // Check for creator slug
  try {
    if (await Creator.exists({ slug: channel_slug })) {
      throw new Error(`Register: Creator ${channel_slug} already exists in DB`);
    }
  } catch (error) {
    throw error;
  }

  // Get creator
  const creator = await Creator.findOne({ slug: channel_slug });
  if (!creator) {
    throw new Error(`Register: Creator ${channel_slug} not found in DB`);
  }
  console.log(creator); // Temp

  // Check the last time the creator's nebula videos were scraped
  const { last_scraped_nebula, last_scraped_youtube } = creator;

  // If the creator's videos were scraped more than 4 hours ago, scrape them again
  if (
    last_scraped_nebula &&
    last_scraped_youtube &&
    new Date().getTime() -
      Math.min(last_scraped_nebula.getTime(), last_scraped_youtube.getTime()) >
      14400000
  ) {
    logger.log("Match: Creator scraped more than 4 hours ago, scraping again");
    try {
      await videosFromNebula(channel_slug, true);
      await videosFromYoutube(channel_slug, true);
    } catch (error) {
      logger.error("Match: Error scraping videos");
      throw error;
    }
  }

  // Get creator's youtube videos
  const youtube_videos = await YoutubeVideos.find({
    _id: {
      $in: creator.youtube_videos?.map((video: any) => {
        return video._id;
      }),
    },
  });
  if (!youtube_videos) {
    throw new Error(`Match: No youtube videos found for ${channel_slug}`);
  }

  // Get creator's nebula videos
  const nebula_videos = await NebulaVideos.find({
    _id: {
      $in: creator.nebula_videos?.map((video: any) => {
        return video._id;
      }),
    },
  });
  if (!nebula_videos) {
    throw new Error(`Match: No nebula videos found for ${channel_slug}`);
  }
};
