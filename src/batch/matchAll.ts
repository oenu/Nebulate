import { Channel } from "../models/channel/channel";
import logger from "../utils/logger";
const hourMatchInterval = 6;

/**
 * @function matchAll
 * @description This function matches all Nebula videos to Youtube videos and attributes the matched videos to the channels.
 * @description This function calls {@link matchVideos} on each channel
 * @returns {Promise<void>} A promise that resolves if the channels are matched.
 * @throws {Error} If the channels cannot be matched.
 * @async
 * @see {@link matchVideos}
 */

const matchAll = async () => {
  logger.warn("matchAll: Matching videos");
  console.time("matchAll");

  // Get all channels that have videos and are outside of the hourMatchInterval
  const channels = await Channel.find({
    $or: [
      { lastMatched: { $exists: false } },
      {
        lastMatched: { $lt: Date.now() - hourMatchInterval * 60 * 60 * 1000 },
      },
    ],
  });
  logger.debug("matchAll: Found " + channels.length + " channels, matching");

  // Iterate through each channel and match their videos
  for await (const channel of channels) {
    await channel.matchVideos();
    await channel.save();
    // wait for 10 seconds between matches
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  logger.info("matchAll: Done matching videos");
  console.timeEnd("matchAll");
  return;
};

export default matchAll;
