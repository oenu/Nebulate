import logger from "../utils/logger";
// import Fuse from "fuse.js";

// Types
import type { NebulaVideoType } from "../models/nebulaVideo/nebulaVideo";
// import type { YoutubeVideoType } from "../models/youtubeVideo";

// Mongo Models

// interface YoutubeMatches {
//   youtube_video: YoutubeVideoType;
//   score: number;
// }

// interface MatchResult {
//   nebula_video: NebulaVideoType;
//   youtube_matches: Array<YoutubeMatches>;
// }

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

  // // Get channel's youtube videos
  // const youtube_videos: YoutubeVideoType[] = await channel.getYoutubeVideos();
  // Get channel's nebula videos
  const nebula_videos: NebulaVideoType[] = await channel.getNebulaVideos();

  // logger.debug(
  //   `Match: Matching ${youtube_videos.length} youtube videos against ${nebula_videos.length} nebula videos`
  // );

  // // --- Matcher Function ---
  // const matched_videos = await matcher(nebula_videos, youtube_videos);

  // if (matched_videos.length === 0) {
  //   logger.error(`Match: No videos matched for ${channelSlug}`);
  //   return;
  // } else {
  //   logger.debug(
  //     `Match: Found ${matched_videos.length} possible matched videos for ${channelSlug}`
  //   );
  // }

  // let matchCount = 0;
  // for await (const match_set of matched_videos) {
  //   const { nebula_video, youtube_matches } = match_set;
  //   for (const youtube_match of youtube_matches) {
  //     if (youtube_match === undefined) return;
  //     // const { youtube_video, score } = youtube_match;
  //     try {
  //       // await nebula_video.updateMatch(youtube_video, score);
  //       await nebula_video.rematch();
  //       matchCount++;
  //     } catch (error) {
  //       logger.error(error);
  //     }
  //   }
  // }
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

/**
 * @function matcher
 * @description Match videos from Nebula to Youtube for given channel
 * @param {NebulaVideoType[]} [nebula_videos] - The videos to match
 * @param {YoutubeVideoType[]} [youtube_videos] - The videos to match
 * @returns {MatchResult[]} - The matched videos
 * @async
 */
// const matcher = async (
//   nebula_videos: Array<NebulaVideoType>,
//   youtube_videos: Array<YoutubeVideoType>
// ): Promise<MatchResult[]> => {
//   const fuse = new Fuse(youtube_videos, {
//     keys: ["title"],
//     threshold: 0.2,
//     distance: 10,
//     shouldSort: true,
//     includeScore: true,
//   });

//   let match_sets: Array<MatchResult> = [];

//   nebula_videos.forEach((nebula_video: NebulaVideoType) => {
//     if (!nebula_video.title) return;

//     // Match youtube videos to nebula videos using fuse.js sorted by score
//     const youtube_matches = fuse.search(nebula_video.title);

//     // if there are matches, add them to the match_sets
//     if (youtube_matches.length > 0) {
//       match_sets.push({
//         nebula_video: nebula_video,
//         youtube_matches: youtube_matches.map(
//           (match: Fuse.FuseResult<YoutubeVideoType>) => {
//             return {
//               youtube_video: match.item,
//               score: match.score,
//             } as YoutubeMatches;
//           }
//         ),
//       });
//     }
//     return;
//   });

//   // Filter out empty match sets
//   match_sets = match_sets.filter((video): video is any => {
//     return video !== undefined;
//   });

//   return match_sets;
// };
