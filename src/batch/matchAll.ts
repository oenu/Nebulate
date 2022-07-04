import { Creator } from "../models/creator";
import logger from "../utils/logger";
const hourMatchInterval = 6;

/**
 * @function matchAll
 * @description This function matches all Nebula videos to Youtube videos and attributes the matched videos to the creators.
 * @description This function calls {@link matchVideos} on each creator
 * @returns {Promise<void>} A promise that resolves if the creators are matched.
 * @throws {Error} If the creators cannot be matched.
 * @async
 * @see {@link matchVideos}
 */

const matchAll = async () => {
  logger.warn("matchAll: Matching videos");
  console.time("matchAll");

  // Get all creators that have videos and are outside of the hourMatchInterval
  const creators = await Creator.find({
    $or: [
      { last_matched: { $exists: false } },
      {
        last_matched: { $lt: Date.now() - hourMatchInterval * 60 * 60 * 1000 },
      },
    ],
  });
  logger.debug("matchAll: Found " + creators.length + " creators, matching");

  // Iterate through each creator and match their videos
  for await (const creator of creators) {
    await creator.matchVideos();
    await creator.save();
    // wait for 10 seconds between matches
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
  logger.info("matchAll: Done matching videos");
  console.timeEnd("matchAll");
  return;
};

export default matchAll;
