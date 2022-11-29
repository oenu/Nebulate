// Register channel in DB
import axios from "axios";
import logger from "../utils/logger";
import { youtube } from "@googleapis/youtube";
const yt = youtube("v3");

// Files
import { youtubeIds } from "../utils/youtubeIds";

// Functions
import videosFromNebula from "../scrape/videosFromNebula";
import videosFromYoutube from "../scrape/videosFromYoutube";

// Mongo Models
import { Channel } from "../models/channel/channel";

/**
 * @function register
 * @description Register a channel in the DB
 * @param {string} channelSlug - The channel's channel slug
 * @returns {Promise<void>} - Resolves when channel is registered in DB
 * @throws {Error} - If the channel already exists in the DB or if the channel does not have a youtube upload id
 * @async
 */
const register = async (channelSlug: string): Promise<void> => {
  // Check if channel exists in DB
  try {
    if (await Channel.exists({ slug: channelSlug })) {
      throw new Error(`Register: Channel ${channelSlug} already exists in DB`);
    }
  } catch (error) {
    logger.error(error);
    logger.info(`Register: Channel ${channelSlug} already exists in DB`);
    throw error;
  }

  // Get channel from Nebula
  const channel_nebula = await channelFromNebula(channelSlug);
  const { id, slug, title, description, type, zypeId, merch_collection } =
    channel_nebula.data.details;

  // Get channel youtube id from youtube mapping
  const channelYtId = await idFromYoutube(channelSlug);
  if (!channelYtId) {
    throw new Error(
      `Register: Channel ${channelSlug} does not exist in youtube mapping`
    );
  }

  // Get channel data from Youtube - channel upload playlist
  const channel_youtube = await channelFromYoutube(channelYtId);

  if (!channel_youtube.upload_playlist_id)
    throw new Error(
      `Register: Channel ${channelSlug} no upload playlist id from youtube API`
    );

  logger.info(`Register: Adding ${channelSlug} to the database`);
  // Map channel data to schema
  const channel = new Channel({
    nebulaId: id,
    slug,
    title,
    description,
    type,
    zypeId,
    youtubeId: channelYtId,
    merch_collection,
    custom_url: channel_youtube.custom_url,
    youtubeUploadId: channel_youtube.upload_playlist_id,
  });

  // Register channel in DB
  await Channel.create(channel);

  // Scrape the channel's videos from Nebula and add them to the database
  await videosFromNebula(channelSlug, false, 5000);
  // Scrape the channel's videos from Youtube and add them to the database
  await videosFromYoutube(channelSlug, false, 5000);
  return;
};

/**
 * @function channelFromNebula
 * @description Get channel data from Nebula
 * @param {string} channelSlug - The channel's channel slug
 * @returns {Promise<AxiosResponse<NebulaChannelType>>} - Resolves with channel data
 * @throws {Error} - If the channel does not exist in Nebula
 * @async
 */
export const channelFromNebula = async (channelSlug: string): Promise<any> => {
  try {
    const url = `https://content.watchnebula.com/video/channels/${channelSlug}/`;
    const response = await axios.get(url, {
      data: {
        Authorization: `Bearer ${global.token}`,
      },
    });
    return response;
  } catch (error: any) {
    if (error?.code === "ERR_BAD_REQUEST") {
      logger.error(`Register: ${channelSlug} not valid slug`);
      throw new Error(`Register: ${channelSlug} not valid slug`);
    }
    logger.info(`Register: Channel ${channelSlug} does not exist in Nebula`);
    throw error;
  }
};

/**
 * @function idFromYoutube
 * @description Get channel youtube id from manual youtube mapping
 * @param {string} channelSlug - The channel's channel slug
 * @returns {Promise<string>} - Resolves with channel youtube id
 * @throws {Error} - If the channel does not have a youtube id
 * @async
 */
export const idFromYoutube = async (
  channelSlug: string
): Promise<string | undefined> => {
  try {
    const channelYtId = youtubeIds.find(
      (channel) => channel.slug === channelSlug
    )?.youtubeId;
    if (channelYtId) return channelYtId;
    else return undefined;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * @function channelFromYoutube
 * @description Get channel data from Youtube
 * @param {string} channelYtId - The channel's youtube id
 * @returns {Promise<{upload_playlist_id, channelTitle, custom_url}>} - Resolves with specific channel data
 * @throws {Error} - If the channel does not exist in Youtube or the lookup fails
 * @async
 */
export const channelFromYoutube = async (
  channelYtId: string
): Promise<{
  upload_playlist_id: string;
  channelTitle: string;
  custom_url: string;
}> => {
  const response = await yt.channels.list({
    id: [channelYtId],
    auth: process.env.YOUTUBE_API_KEY as string,
    part: ["contentDetails"],
  });
  if (!response?.data?.items || !response?.data?.items[0])
    throw new Error(
      "Register: Could not get upload playlist id from youtube API"
    );
  const channel = response?.data?.items[0];
  const upload_playlist_id = channel.contentDetails?.relatedPlaylists?.uploads;
  const channelTitle = channel.snippet?.title;
  const custom_url = channel.snippet?.customUrl;

  if (!upload_playlist_id)
    throw new Error(
      "Register: Could not get upload playlist id from youtube API"
    );
  if (!channelTitle)
    throw new Error("Register: Could not get channel title from youtube API");
  if (!custom_url)
    throw new Error(
      "Register: Could not get channel custom url from youtube API"
    );

  return { upload_playlist_id, channelTitle, custom_url };
};

export default register;
