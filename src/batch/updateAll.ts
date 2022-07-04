import { Channel } from "../models/channel";
import logger from "../utils/logger";
const hourScrapeInterval = 6;

/**
 * @function updateAll
 * @description This function updates all channels in the database.
 * @returns {Promise<void>} A promise that resolves if the channels are updated.
 * @throws {Error} If the channels cannot be updated.
 * @async
 * @see {@link scrapeNebula} {@link scrapeYoutube} {@link matchVideos}
 */

const updateAll = async () => {
  // Get all channels
  const channels = await Channel.find({}).select(
    "lastScrapedNebula lastScrapedYoutube lastMatched slug"
  );

  const scrapeThreshold =
    new Date().getTime() - hourScrapeInterval * 60 * 60 * 1000;

  // For each channel, check if it needs to be updated
  for (const channel of channels) {
    let needsRematch = false;

    // Check if the channel needs to be updated
    if (channel.lastScrapedNebula.getTime() < scrapeThreshold) {
      // Scrape the channel's videos from Nebula
      await channel.scrapeNebula();
      needsRematch = true;
    }
    if (channel.lastScrapedYoutube.getTime() < scrapeThreshold) {
      // Scrape the channel's videos from Youtube
      await channel.scrapeYoutube();
      needsRematch = true;
    }

    // Match the channel's videos
    // Will run if the channel has released new videos or if it has not been matched in a while
    if (channel.lastMatched.getTime() < scrapeThreshold * 3 || needsRematch) {
      await channel.matchVideos();
    }

    // Wait for 1 minute before checking the next channel
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
  logger.info("updateAll: Done updating channels");
  return;
};

export default updateAll;
