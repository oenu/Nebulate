import { Channel } from "../models/channel/channel";
import { generateTable } from "../table/generateTable";
import uploadTable from "../table/uploadTable";
import logger from "../utils/logger";
const youtubeScrapeInterval = 2 * 60 * 60 * 1000; // 2 hours
const nebulaScrapeInterval = 12 * 60 * 60 * 1000; // 12 hours
const matchInterval = 7 * 24 * 60 * 60 * 1000; // 7 days

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

  let addedYoutube = 0;
  let addedNebula = 0;
  let ranMatch = 0;

  // Deadline for the last time the channel was scraped
  const youtubeScrapeThreshold = new Date().getTime() - youtubeScrapeInterval;
  // Log youtube scrape threshold
  logger.info(
    `UpdateAll: Youtube scrape threshold: ${new Date(
      youtubeScrapeThreshold
    ).toLocaleString()}`
  );
  const nebulaScrapeThreshold = new Date().getTime() - nebulaScrapeInterval;
  // Log nebula scrape threshold
  logger.info(
    `UpdateAll: Nebula scrape threshold: ${new Date(
      nebulaScrapeThreshold
    ).toLocaleString()}`
  );

  // Quickly check if any channels need to be scraped, note that some will not have a lastScrapedNebula or lastScrapedYoutube
  const channelsToScrape = channels.filter((channel) => {
    // Debug this
    console.log(
      "Nebula threshold",
      channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold
    );
    console.log(
      "Youtube Threshold",
      channel.lastScrapedYoutube.getTime() < youtubeScrapeThreshold
    );

    if (!channel.lastScrapedNebula || !channel.lastScrapedYoutube) {
      return true;
    }

    return (
      channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold ||
      channel.lastScrapedYoutube.getTime() < youtubeScrapeThreshold
    );
  });

  // If no channels need to be scraped, return
  if (channelsToScrape.length === 0) {
    logger.info("No channels need to be scraped");
    console.timeEnd("updateAll");
    return;
  } else {
    logger.info(`${channelsToScrape.length} channels might need to be scraped`);
  }

  // For each channel, check if it needs to be updated
  for await (const channel of channels) {
    let needsRematch = false; // If the channel needs to be rematched, only actually rematch if it has been scraped
    let needsDeepScrape = false; // Catch channels that were registered but never scraped

    // ================================ Youtube ================================
    // Check if the channel needs to be updated
    let newYoutubeVideos = [];
    if (!channel.lastScrapedYoutube) {
      logger.warn("No lastScrapedNebula for channel " + channel.slug);
      needsDeepScrape = true;
      newYoutubeVideos = (await channel.scrapeYoutube(needsDeepScrape)) || [];
      needsRematch = true;
    } else if (channel.lastScrapedYoutube.getTime() < youtubeScrapeThreshold) {
      // Scrape the channel's videos from Youtube
      newYoutubeVideos = (await channel.scrapeYoutube()) || [];
    }

    // Check if any new youtube videos were scraped
    if (newYoutubeVideos.length > 0) {
      addedYoutube += newYoutubeVideos.length;
      needsRematch = true;
      logger.info(
        `Scraped ${newYoutubeVideos?.length} new youtube videos for ${channel.slug}`
      );
    }

    // Check if channel has new youtube videos
    if (!needsRematch) {
      // Catch channels that don't have new youtube videos but also haven't been matched in 7 days
      if (
        !channel.lastMatched ||
        channel.lastMatched.getTime() <
          youtubeScrapeThreshold - 1000 * 60 * 60 * 24 * 7 // 7 days
      ) {
        logger.info(
          "Channel " +
            channel.slug +
            " has not been matched in the last 7 days, rematching"
        );
        needsRematch = true;

        // Catch channels that don't have new youtube videos but also haven't been nebula scraped in the last 2 days
      } else if (
        channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold
        // nebulaScrapeInterval - 1000 * 60 * 60 * 24 * 2
      ) {
        logger.info(
          "Channel " +
            channel.slug +
            "'s Nebula videos haven't been scraped in the last 2 days, continuing"
        );
      } else {
        logger.debug(
          "Channel " + channel.slug + " does not need to be updated, skipping"
        );
        continue;
      }
    }
    // ================================ Nebula ================================
    let newNebulaVideos = [];
    let scrapedNebula = false;
    if (!channel.lastScrapedNebula) {
      logger.warn("No lastScrapedNebula for channel " + channel.slug);
      needsDeepScrape = true;
      newNebulaVideos = (await channel.scrapeNebula(needsDeepScrape)) || [];
      scrapedNebula = true;
      needsRematch = true;
    } else if (channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold) {
      // Scrape the channel's videos from Nebula
      newNebulaVideos = (await channel.scrapeNebula(needsDeepScrape)) || [];
      scrapedNebula = true;
    }

    // Check if any new nebula videos were scraped
    if (newNebulaVideos.length > 0) {
      addedNebula += newNebulaVideos.length;
      needsRematch = true;
      logger.info(
        `Scraped ${newNebulaVideos?.length} new nebula videos for ${channel.slug}`
      );
    }

    // Match the channel's videos
    // Will run if the channel has released new videos or if it has not been matched in a while
    if (!channel.lastMatched) {
      logger.warn("No lastMatched for channel " + channel.slug);
      await channel.matchVideos();
      ranMatch++;
    } else if (needsRematch) {
      await channel.matchVideos();
      ranMatch++;
    }

    /**
     * Note: Nebula has a much stricter rate limit than Youtube, so we will only have to wait if we scraped from Nebula
     */

    console.timeLog("updateAll", "Finished " + channel.slug);

    // Wait if we scraped from Nebula
    if (scrapedNebula) {
      logger.info("Waiting 30s for Nebula rate limit");
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
  }
  logger.info(
    `updateAll: Done updating channels, added ${addedYoutube} youtube videos, ${addedNebula} nebula videos and ran ${ranMatch} match jobs`
  );
  console.timeEnd("updateAll");

  if (addedYoutube > 0 || addedNebula > 0 || ranMatch > 0) {
    // Generate a new lookup table
    logger.info("updateAll: Generating new lookup table");
    console.time("generateTable");
    await generateTable();
    console.timeEnd("generateTable");

    // Upload the lookup table to storage
    logger.info("updateAll: Uploading lookup table to storage");
    console.time("uploadTable");
    await uploadTable();
    console.timeEnd("uploadTable");
    return;
  } else {
    logger.info("updateAll: No new videos, skipping lookup table generation");
  }

  return;
};

export default updateAll;
