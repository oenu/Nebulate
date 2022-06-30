// Register creator in DB
import axios from "axios";
import logger from "../utils/logger";
import { youtube } from "@googleapis/youtube";
const yt = youtube("v3");

// Files
import { youtubeIds } from "../store/youtubeIds";

// Functions
import videosFromNebula from "../scrapers/videosFromNebula";
import videosFromYoutube from "../scrapers/videosFromYoutube";

// Mongo Models
import { Creator } from "../models/creator";

/**
 * @function registerCreatorInDB
 * @description Register a creator in the DB
 * @param {string} channel_slug - The creator's channel slug
 * @returns {Promise<void>} - Resolves when creator is registered in DB
 * @throws {Error} - If the creator already exists in the DB or if the creator does not have a youtube upload id
 * @async
 */
const registerCreatorInDB = async (channel_slug: string) => {
  // Check if creator exists in DB
  try {
    if (await Creator.exists({ slug: channel_slug })) {
      throw new Error(`Register: Creator ${channel_slug} already exists in DB`);
    }
  } catch (error) {
    logger.error(error);
    logger.info(`Register: Creator ${channel_slug} already exists in DB`);
    throw error;
  }

  // Get creator from Nebula
  const creator_nebula = await creatorFromNebula(channel_slug);
  const { id, slug, title, description, type, zype_id } =
    creator_nebula.data.details;

  // Get creator youtube id from youtube mapping
  const creatorYtId = await idFromYoutube(channel_slug);
  if (!creatorYtId) {
    throw new Error(
      `Register: Creator ${channel_slug} does not exist in youtube mapping`
    );
  }

  // Get creator data from Youtube - channel upload playlist
  const creator_youtube = await creatorFromYoutube(creatorYtId);

  if (!creator_youtube.upload_playlist_id)
    throw new Error(
      `Register: Creator ${channel_slug} no upload playlist id from youtube API`
    );

  logger.info(`Adding ${channel_slug} to the database`);
  // Map creator data to schema
  const creator = new Creator({
    nebula_id: id,
    slug,
    title,
    description,
    type,
    zype_id,
    youtube_id: creatorYtId,
    youtube_upload_id: creator_youtube.upload_playlist_id,
  });

  // Register creator in DB
  await Creator.create(creator);

  // Scrape the creator's videos from Nebula and add them to the database
  await videosFromNebula(channel_slug, false, 5000);
  // Scrape the creator's videos from Youtube and add them to the database
  await videosFromYoutube(channel_slug, false, 5000);
  return;
};

/**
 * @function creatorFromNebula
 * @description Get creator data from Nebula
 * @param {string} channel_slug - The creator's channel slug
 * @returns {Promise<AxiosResponse<NebulaCreatorType>>} - Resolves with creator data
 * @throws {Error} - If the creator does not exist in Nebula
 * @async
 */
export const creatorFromNebula = async (channel_slug: string) => {
  try {
    const url = `https://content.watchnebula.com/video/channels/${channel_slug}/`;
    const response = await axios.get(url, {
      data: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  } catch (error: any) {
    if (error?.code === "ERR_BAD_REQUEST") {
      logger.error(`Register: ${channel_slug} not valid slug`);
      throw new Error(`Register: ${channel_slug} not valid slug`);
    }
    logger.info(`Register: Creator ${channel_slug} does not exist in Nebula`);
    throw error;
  }
};

/**
 * @function idFromYoutube
 * @description Get creator youtube id from manual youtube mapping
 * @param {string} channel_slug - The creator's channel slug
 * @returns {Promise<string>} - Resolves with creator youtube id
 * @throws {Error} - If the creator does not have a youtube id
 * @async
 */
export const idFromYoutube = async (channel_slug: string) => {
  try {
    const creatorYtId = youtubeIds.find(
      (creator) => creator.slug === channel_slug
    )?.youtube_id;
    if (creatorYtId) return creatorYtId;
    else return null;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * @function creatorFromYoutube
 * @description Get creator data from Youtube
 * @param {string} creatorYtId - The creator's youtube id
 * @returns {Promise<{upload_playlist_id, channel_title, custom_url}>} - Resolves with spcific creator data
 * @throws {Error} - If the creator does not exist in Youtube or the lookup fails
 * @async
 */
export const creatorFromYoutube = async (creatorYtId: string) => {
  const response = await yt.channels.list({
    id: [creatorYtId],
    auth: process.env.YOUTUBE_API_KEY as string,
    part: ["contentDetails"],
  });
  if (!response?.data?.items || !response?.data?.items[0])
    throw new Error(
      "Register: Could not get upload playlist id from youtube API"
    );
  const creator = response?.data?.items[0];
  const upload_playlist_id = creator.contentDetails?.relatedPlaylists?.uploads;
  const channel_title = creator.snippet?.title;
  const custom_url = creator.snippet?.customUrl;

  return { upload_playlist_id, channel_title, custom_url };
};

export default registerCreatorInDB;
