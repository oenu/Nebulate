// Register creator in DB

import axios from "axios";

import logger from "../config/logger";
import { Creator } from "../models/creator";
import videosFromNebula from "./videosFromNebula";
import { youtube } from "@googleapis/youtube";
import youtubeIds from "../config/youtubeIds";
import videosFromYoutube from "./videosFromYoutube";
const yt = youtube("v3");

const registerCreatorInDB = async (creatorSlug: string) => {
  // Check if creator exists in DB
  try {
    if (await Creator.exists({ slug: creatorSlug })) {
      throw new Error(`Register: Creator ${creatorSlug} already exists in DB`);
    }
  } catch (error) {
    logger.error(error);
    logger.info(`Register: Creator ${creatorSlug} already exists in DB`);
    throw error;
  }

  // Main try/catch block
  // Collect creator data from Nebula and Youtube and save to DB
  let response;
  try {
    // Get creator data from Nebula
    const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
    response = await axios.get(url, {
      data: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    if (error?.code === "ERR_BAD_REQUEST") {
      logger.error(`Register: ${creatorSlug} not valid slug`);
      throw new Error(`Register: ${creatorSlug} not valid slug`);
    }
    logger.info(`Register: Creator ${creatorSlug} does not exist in Nebula`);
    throw error;
  }

  try {
    // Get Creator Youtube_id from lookup table
    const creatorYtId = youtubeIds.find(
      (creator) => creator.slug === creatorSlug
    )?.youtube_id;

    if (!creatorYtId) {
      throw new Error(
        `Register: Creator ${creatorSlug} does not exist in youtube mapping`
      );
    }

    // Get creator data from Youtube - channel upload playlist
    if (creatorYtId && process.env.YOUTUBE_API_KEY) {
      let res;
      try {
        res = await yt.channels.list({
          id: [creatorYtId],
          auth: process.env.YOUTUBE_API_KEY,
          part: ["contentDetails"],
        });
      } catch (error) {
        logger.error(error);
        logger.error(
          "Register: Could not get upload playlist id from youtube API"
        );
        throw new Error(
          "Register: Could not get upload playlist id from youtube API"
        );
      }

      try {
        // Create new creator document in DB
        if (res.data?.items) {
          logger.info(`Adding ${creatorSlug} to the database`);
          await Creator.create({
            id: response.data.details.id,
            slug: response.data.details.slug,
            title: response.data.details.title,
            description: response.data.details.description,
            type: response.data.details.type,
            "zype-id": response.data.details.zype_id,
            youtube_id: creatorYtId,
            youtube_upload_id:
              res.data?.items[0]?.contentDetails?.relatedPlaylists?.uploads,
          });
        }
      } catch (error) {
        // Catch for creating creator document in DB
        logger.error(error);
        logger.error(`Register: Could not add ${creatorSlug} to the database`);
        throw new Error(
          `Register: Could not add ${creatorSlug} to the database`
        );
      }
    }
  } catch (error) {
    // Catch for Creator lookup and creation
    throw error;
  }

  // Scrape the creator's videos
  logger.info(`Register: Scraping ${creatorSlug}'s videos`);

  // Scrape the creator's videos from Nebula and add them to the database
  try {
    await videosFromNebula(creatorSlug, false, 500);
  } catch (error) {
    // Catch for videosFromNebula
    logger.error(`Register: Could not scrape ${creatorSlug}'s Nebula videos`);
    throw new Error(
      `Register: Could not scrape ${creatorSlug}'s Nebula videos`
    );
  }

  // Scrape the creator's videos from Youtube and add them to the database
  try {
    await videosFromYoutube(creatorSlug, false, 20); // HACK: Change to 500
  } catch (error) {
    // Catch for videosFromYoutube
    logger.error(`Register: Could not scrape ${creatorSlug}'s Youtube videos`);
    throw new Error(
      `Register: Could not scrape ${creatorSlug}'s Youtube videos`
    );
  }
};

export default registerCreatorInDB;
