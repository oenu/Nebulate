// Register creator in DB

import axios from "axios";

import logger from "../config/logger";
import { Creator } from "../models/creator";
import videosFromNebula from "./videosFromNebula";

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
  // Get creator data from Nebula
  try {
    const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
    const response = await axios.get(url, {
      data: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Add a new creator to the database
    try {
      logger.info(`Adding ${creatorSlug} to the database`);
      await Creator.create({
        id: response.data.details.id,
        slug: response.data.details.slug,
        title: response.data.details.title,
        description: response.data.details.description,
        type: response.data.details.type,
        "zype-id": response.data.details.zype_id,
      });
    } catch (error) {
      logger.error(error);
      logger.error(
        `Register: Could not add ${creatorSlug} to the database, likely already exists`
      );
      throw new Error(
        `Register: Could not add ${creatorSlug} to the database, likely already exists`
      );
    }
  } catch (error: any) {
    if (error?.code === "ERR_BAD_REQUEST") {
      logger.error(`Register: ${creatorSlug} not valid slug`);
      throw new Error(`Register: ${creatorSlug} not valid slug`);
    } else {
      // Pass Error up the chain
      logger.error(error);
      throw error;
    }
  }
  // Scrape the creator's videos
  logger.info(`Register: Scraping ${creatorSlug}'s videos`);

  // Scrape the creator's videos from Nebula and add them to the database
  try {
    await videosFromNebula(creatorSlug, false, 10); // TODO: Change to 500
  } catch (error) {
    logger.error(`Register: Could not scrape ${creatorSlug}'s videos`);
    throw new Error(`Register: Could not scrape ${creatorSlug}'s videos`);
  }
};

export default registerCreatorInDB;
