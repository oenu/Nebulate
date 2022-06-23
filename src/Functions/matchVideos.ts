import logger from "../config/logger";
import { Creator } from "../models/creator";
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";
import { YoutubeVideo as YoutubeVideos } from "../models/youtubeVideo";
import { NebulaVideo as NebulaVideos } from "../models/nebulaVideo";

/**
 * Match Nebula videos to Youtube videos, from the database
 * @param  {string} channel_slug - The channel slug
 * @param  {Array.<string>} rematch_nebula_slug? - The slug of the video to rematch
 * @param  {Array.<string>} rematch_yt_id? - The youtube id of the video to rematch
 * @param {boolean} rematch_all? - Whether to attempt to rematch all videos
 *
 */
const matchVideos = async (
  channel_slug: string,
  rematch_nebula_slug?: Array<string>,
  rematch_yt_id?: Array<string>,
  rematch_all?: boolean
) => {
  logger.log(`Matching videos for ${channel_slug}`);
  console.log(rematch_nebula_slug, rematch_yt_id, rematch_all); // Temp

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
  let youtube_videos: YoutubeVideos[] = [];
  // Get specific youtube video/videos if passed in
  if (rematch_yt_id && !rematch_all) {
    const specificYtVideos = await YoutubeVideos.find({
      youtube_id: { $in: rematch_yt_id },
    });
    if (specificYtVideos && specificYtVideos.length > 0) {
      youtube_videos.push(...specificYtVideos);
    } else {
      throw new Error(`Match: Youtube video ${rematch_yt_id} not found in DB`);
    }
  }

  // Get all youtube videos if no specific video was passed in
  if (!rematch_yt_id || rematch_all) {
    youtube_videos = await YoutubeVideos.find({
      _id: {
        $in: creator.youtube_videos?.map((video: any) => {
          return video._id;
        }),
      },
    }).select("title");
    if (!youtube_videos) {
      throw new Error(`Match: No youtube videos found for ${channel_slug}`);
    }
    logger.info(`Match: Found ${youtube_videos.length} youtube videos`);
  }

  // Get creator's nebula videos
  let nebula_videos: NebulaVideos[] = [];
  // Get specific nebula video/videos if passed in
  if (rematch_nebula_slug && !rematch_all) {
    const specificNebVideos = await NebulaVideos.find({
      slug: { $in: rematch_nebula_slug },
    });
    if (specificNebVideos && specificNebVideos.length > 0) {
      nebula_videos.push(...specificNebVideos);
    } else {
      throw new Error(
        `Match: Nebula video ${rematch_nebula_slug} not found in DB`
      );
    }
  }

  // Get all nebula videos if no specific video was passed in
  if (!rematch_nebula_slug || rematch_all) {
    nebula_videos = await NebulaVideos.find({
      _id: {
        $in: creator.nebula_videos?.map((video: any) => {
          return video._id;
        }),
      },
    }).select("title");
    if (!nebula_videos) {
      throw new Error(`Match: No nebula videos found for ${channel_slug}`);
    }
  }
  // Match videos
};
