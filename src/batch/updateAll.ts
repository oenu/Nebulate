import { Creator } from "../models/creator";
import logger from "../utils/logger";
const hourScrapeInterval = 6;

/**
 * @function updateAll
 * @description This function updates all creators in the database.
 * @returns {Promise<void>} A promise that resolves if the creators are updated.
 * @throws {Error} If the creators cannot be updated.
 * @async
 * @see {@link scrapeNebula} {@link scrapeYoutube} {@link matchVideos}
 */

const updateAll = async () => {
  // Get all creators
  const creators = await Creator.find({}).select(
    "last_scraped_nebula last_scraped_youtube last_matched slug"
  );

  const scrapeThreshold =
    new Date().getTime() - hourScrapeInterval * 60 * 60 * 1000;

  // For each creator, check if it needs to be updated
  for (const creator of creators) {
    let needsRematch = false;

    // Check if the creator needs to be updated
    if (creator.last_scraped_nebula.getTime() < scrapeThreshold) {
      // Scrape the creator's videos from Nebula
      await creator.scrapeNebula();
      needsRematch = true;
    }
    if (creator.last_scraped_youtube.getTime() < scrapeThreshold) {
      // Scrape the creator's videos from Youtube
      await creator.scrapeYoutube();
      needsRematch = true;
    }

    // Match the creator's videos
    // Will run if the creator has released new videos or if it has not been matched in a while
    if (creator.last_matched.getTime() < scrapeThreshold * 3 || needsRematch) {
      await creator.matchVideos();
    }

    // Wait for 1 minute before checking the next creator
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
  logger.info("updateAll: Done updating creators");
  return;
};

export default updateAll;
