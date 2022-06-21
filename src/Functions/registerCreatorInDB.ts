// Register creator in DB

// import axios from "axios";

import logger from "../config/logger";
import type { CreatorType } from "../models/creator";
import { Creator } from "../models/creator";

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
    throw new Error(error);
  }
};
