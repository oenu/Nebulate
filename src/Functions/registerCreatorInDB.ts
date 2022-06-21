// Register creator in DB

import axios from "axios";

import logger from "../config/logger";
import { Creator } from "../models/creator";
import videosFromNebula from "./videosFromNebula";

const registerCreatorInDB = async (creatorSlug: string) => {
  try {
    const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
    let response = await axios.get(url, {
      data: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Add a new creator to the database
    logger.info(`Adding ${creatorSlug} to the database`);
    const mongoResponse = await Creator.create({
      id: response.data.details.id,
      slug: response.data.details.slug,
      title: response.data.details.title,
      description: response.data.details.description,
      type: response.data.details.type,
      "zype-id": response.data.details.zype_id,
    });
    console.log(mongoResponse);

    // Scrape the creator's videos
    logger.info(`Scraping ${creatorSlug}'s videos`);
    try {
      await videosFromNebula(creatorSlug, false, 10); // TODO: Change to 500
    } catch (error) {
      logger.error(error);
      logger.error(`Could not scrape ${creatorSlug}'s videos`);
      throw new Error(`Could not scrape ${creatorSlug}'s videos`);
    }
  } catch (error: any) {
    if (error.response.status === 404) {
      logger.error(`${creatorSlug} not found`);
    }

    logger.error(`Register: Could not add ${creatorSlug} to the database`);
    throw new Error(error);
  }
};

export default registerCreatorInDB;
