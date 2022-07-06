import logger from "../utils/logger";

// Types
import type { NebulaVideoType } from "../models/nebulaVideo/nebulaVideo";

// Mongo Models
import { Channel } from "../models/channel/channel";

/**
 * @function match
 * @description Match videos from Nebula to Youtube for given channel
 * @param {string} [channelSlug] - The slug of the channel to match videos for
 * @returns {void}
 * @async
 *
 */
const match = async (channelSlug: string) => {
  logger.info(`Match: Matching videos for ${channelSlug}`);
  // Check for channel slug
  if (await !Channel.exists({ slug: channelSlug })) {
    throw new Error(`Match: Channel ${channelSlug} doesn't exist in database`);
  }

  // Get channel
  const channel = await Channel.findOne({ slug: channelSlug });
  if (!channel) {
    throw new Error(`Match: Channel ${channelSlug} not found in DB`);
  }

  // Get channel's nebula videos
  const nebula_videos: NebulaVideoType[] = await channel.getNebulaVideos();

  let newMatchCount = 0;
  let replacedMatchCount = 0;
  let anotherBetterMatchCount = 0;
  let noMatchCount = 0;
  let noChangeCount = 0;

  for await (const nebula_video of nebula_videos) {
    const matchResult = await nebula_video.rematch();
    if (matchResult === "new_match") {
      // logger.info(`Match: New match: ${nebula_video.title}`);
      newMatchCount++;
    } else if (matchResult === "replaced_match") {
      // logger.info(`Match: Replaced match: ${nebula_video.title}`);
      replacedMatchCount++;
    } else if (matchResult === "another_better") {
      // logger.info(`Match: Another better ${nebula_video.title}`);
      anotherBetterMatchCount++;
    } else if (matchResult === "no_change") {
      // logger.info(`Match: No change ${nebula_video.title}`);
      noChangeCount++;
    } else if (matchResult === "no_match") {
      // logger.info(`Match: No match ${nebula_video.title}`);
      noMatchCount++;
    } else {
      logger.error(`Match: Unknown match result for ${nebula_video.title}`);
    }
  }

  // Set Last Match Date
  await channel.logMatch();

  logger.info(
    `Match: Match complete for ${channelSlug}, ${newMatchCount} new, ${replacedMatchCount} replaced, ${anotherBetterMatchCount} another better, ${noMatchCount} no match, ${noChangeCount} no change`
  );

  return;
};
export default match;
