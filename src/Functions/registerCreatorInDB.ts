// Register creator in DB
import axios from "axios";
import logger from "../config/logger";
import { youtube } from "@googleapis/youtube";
const yt = youtube("v3");

// Files
import youtubeIds from "../config/youtubeIds";

// Functions
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";

// Mongo Models
import { Creator } from "../models/creator";

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

  // Main try/catch block

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
  // Create new creator document in DB
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
  await videosFromNebula(channel_slug, false, 500);
  // Scrape the creator's videos from Youtube and add them to the database
  await videosFromYoutube(channel_slug, false, 700);

  // Catch for videosFromYoutube
  logger.error(`Register: Could not scrape ${channel_slug}'s Youtube videos`);
  throw new Error(
    `Register: Could not scrape ${channel_slug}'s Youtube videos`
  );
};

const creatorFromNebula = async (channel_slug: string) => {
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

const idFromYoutube = async (channel_slug: string) => {
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

const creatorFromYoutube = async (creatorYtId: string) => {
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
