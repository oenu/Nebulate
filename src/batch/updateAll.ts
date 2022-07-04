import { Channel } from "../models/channel";
import { generateTable } from "../table/generateTable";
import uploadTable from "../table/uploadTable";
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
  console.time("updateAll");
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
    if (!channel.lastScrapedNebula) {
      logger.warn("No lastScrapedNebula for channel " + channel.slug);
      await channel.scrapeNebula();
      needsRematch = true;
    } else if (channel.lastScrapedNebula.getTime() < scrapeThreshold) {
      // Scrape the channel's videos from Nebula
      await channel.scrapeNebula();
      needsRematch = true;
    }
    if (!channel.lastScrapedYoutube) {
      logger.warn("No lastScrapedNebula for channel " + channel.slug);
      await channel.scrapeYoutube();
      needsRematch = true;
    } else if (channel.lastScrapedYoutube.getTime() < scrapeThreshold) {
      // Scrape the channel's videos from Youtube
      await channel.scrapeYoutube();
      needsRematch = true;
    }

    // Match the channel's videos
    // Will run if the channel has released new videos or if it has not been matched in a while
    if (!channel.lastMatched) {
      logger.warn("No lastMatched for channel " + channel.slug);
      await channel.matchVideos();
    } else if (
      channel.lastMatched.getTime() < scrapeThreshold * 3 ||
      needsRematch
    ) {
      await channel.matchVideos();
    }

    // Wait for 1 minute before checking the next channel
    console.timeLog(
      "updateAll",
      "Finished " + channel.slug + " Waiting 30 seconds"
    );
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
  logger.info("updateAll: Done updating channels");
  console.timeEnd("updateAll");

  // Generate a new lookup table
  logger.info("updateAll: Generating new lookup table");
  await generateTable();

  // Upload the lookup table to storage
  logger.info("updateAll: Uploading lookup table to storage");
  await uploadTable();

  return;
};

export default updateAll;
