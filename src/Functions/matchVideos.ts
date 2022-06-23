import logger from "../config/logger";
import { Creator } from "../models/creator";
/**
 * Match Nebula videos to Youtube videos, from the database
 * @param  {string} channel_slug - The channel slug
 * @param  {string} rematch_nebula_slug? - The slug of the video to rematch
 * @param  {string} rematch_yt_id? - The youtube id of the video to rematch
 */
const matchVideos = async (
  channel_slug: string,
  rematch_nebula_slug?: string,
  rematch_yt_id?: string
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
  // Get videos
};
