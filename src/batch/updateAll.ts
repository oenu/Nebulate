import { Channel } from "../models/channel/channel";
import { generateTable } from "../table/generateTable";
import uploadTable from "../table/uploadTable";
import logger from "../utils/logger";
const youtubeScrapeInterval = 2 * 60 * 60 * 1000; // 2 hours
const nebulaScrapeInterval = 2 * 24 * 60 * 60 * 1000; // 2 days
const matchInterval = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * @function updateAll
 * @description This function updates all channels in the database.
 * @returns {Promise<void>} A promise that resolves if the channels are updated.
 * @throws {Error} If the channels cannot be updated.
 * @async
 * @see {@link scrapeNebula} {@link scrapeYoutube} {@link matchVideos}
 */

const updateAll = async (): Promise<void> => {
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
  const matchThreshold = new Date().getTime() - matchInterval;
  // Log match threshold
  logger.info(
    `UpdateAll: Match threshold: ${new Date(matchThreshold).toLocaleString()}`
  );

  // Quickly check if any channels need to be scraped, note that some will not have a lastScrapedNebula or lastScrapedYoutube
  let needsNebulaScrape = 0;
  let needsYoutubeScrape = 0;
  const channelsToScrape = channels.filter((channel) => {
    if (!channel.lastScrapedNebula || !channel.lastScrapedYoutube) {
      return true;
    } else {
      if (channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold)
        needsNebulaScrape++;
      if (channel.lastScrapedYoutube.getTime() < youtubeScrapeThreshold)
        needsYoutubeScrape++;

      return (
        channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold ||
        channel.lastScrapedYoutube.getTime() < youtubeScrapeThreshold
      );
    }
  });

  // If no channels need to be scraped, return
  if (channelsToScrape.length === 0) {
    logger.info("updateAll: No channels need to be scraped, updating table...");
    await generateTable().catch((err) => {
      logger.error(`updateAll: ${err}`);
    });
    logger.info("updateAll: Table generated, uploading table...");
    await uploadTable().catch((err) => {
      logger.error("updateAll:", err);
    });
    logger.info("updateAll: Table uploaded!");
    console.timeEnd("updateAll");
    return;
  } else {
    logger.info(
      `${
        channelsToScrape.length
      } channels need to be scraped, ${needsNebulaScrape} need nebula scrape, ${needsYoutubeScrape} need youtube scrape, estimating ${Math.round(
        needsNebulaScrape * (1 / 3)
      )} minutes`
    );
  }

  // For each channel, check if it needs to be updated
  for await (const [index, channel] of channels.entries()) {
    const status = {
      needsYoutubeScrape: false, // If the channel needs to be scraped from youtube
      needsNebulaScrape: false, // If the channel needs to be scraped from nebula
      needsMatch: false, // If the channel needs to be matched
      needsDeepScrape: false, // If the channel needs to be scraped deeply (i.e. all videos)
    };

    // Work out what needs to be done
    // If the channel has never been scraped, it needs a deep scrape
    if (!channel.lastScrapedNebula || !channel.lastScrapedYoutube) {
      status.needsDeepScrape = true;
      logger.info(
        `UpdateAll: ${index}/${channels.length} ${channel.slug} needs a deep scrape`
      );
      !channel.lastScrapedNebula && (status.needsNebulaScrape = true);
      !channel.lastScrapedYoutube && (status.needsYoutubeScrape = true);
    } else {
      // Youtube Scrape
      if (channel.lastScrapedYoutube.getTime() < youtubeScrapeThreshold) {
        // If the last scrape was before the threshold, scrape it
        logger.info(
          `UpdateAll: ${index}/${channels.length}: ${channel.slug} needs a youtube scrape`
        );
        status.needsYoutubeScrape = true;
      }

      // Nebula Scrape
      if (channel.lastScrapedNebula.getTime() < nebulaScrapeThreshold) {
        // If the last scrape was before the threshold, scrape it
        logger.info(
          `UpdateAll: ${index}/${channels.length}: ${channel.slug} needs a nebula scrape`
        );
        status.needsNebulaScrape = true;
      }

      // Match
      if (channel.lastMatched.getTime() < matchThreshold) {
        // If the last match was before the threshold, match it
        logger.info(
          `UpdateAll: ${index}/${channels.length}: ${channel.slug} needs a match`
        );
        status.needsMatch = true;
      }
    }

    // Arrays to store the videos that have been added
    let newYoutubeVideos = [];
    let newNebulaVideos = [];

    // Scrape youtube (if needed)
    if (status.needsYoutubeScrape || status.needsDeepScrape) {
      newYoutubeVideos =
        (await channel.scrapeYoutube(status.needsDeepScrape)) || [];
      addedYoutube += newYoutubeVideos.length;
    }

    // Scrape nebula (if needed)

    if (
      status.needsNebulaScrape ||
      status.needsDeepScrape ||
      newYoutubeVideos.length > 0
    ) {
      newNebulaVideos =
        (await channel.scrapeNebula(status.needsDeepScrape)) || [];
      addedNebula += newNebulaVideos.length;
    }

    // Match videos (if needed)
    if (
      status.needsMatch ||
      newNebulaVideos.length > 0 ||
      newYoutubeVideos.length > 0
    ) {
      await channel.matchVideos();
      ranMatch++;
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
