import logger from "../config/logger";
import { Creator, CreatorType } from "../models/creator";
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";
import {
  YoutubeVideo,
  YoutubeVideo as YoutubeVideos,
} from "../models/youtubeVideo";
import { NebulaVideo as NebulaVideos } from "../models/nebulaVideo";
import Fuse from "fuse.js";

/**
 * Match Nebula videos to Youtube videos, from the database
 * @param  {string} channel_slug - The channel slug
 * @param  {Array.<string>} rematch_nebula_slug? - The slug of the video to rematch
 * @param  {Array.<string>} rematch_yt_id? - The youtube id of the video to rematch
 * @param {boolean} rematch_all? - Whether to attempt to rematch all videos
 *
 */
const matchVideos = async (
  channel_slug: string,
  rematch_nebula_slug?: Array<string>,
  rematch_yt_id?: Array<string>
) => {
  logger.info(`Matching videos for ${channel_slug}`);

  // Check for creator slug
  if (await !Creator.exists({ slug: channel_slug })) {
    throw new Error(`Match: Creator ${channel_slug} doesn't exist in database`);
  }

  // Get creator
  const creator = await Creator.findOne({ slug: channel_slug });
  if (!creator) {
    throw new Error(`Match: Creator ${channel_slug} not found in DB`);
  }

  // Check to see if creator has youtube id
  if (!creator.youtube_id) {
    throw new Error(`Match: Creator ${channel_slug} has no youtube id`);
  }

  // Check the last time the creator's nebula videos were scraped
  const { last_scraped_nebula, last_scraped_youtube } = creator;

  // If the creator's videos were scraped more than 4 hours ago, scrape them again
  if (
    last_scraped_nebula &&
    last_scraped_youtube &&
    new Date().getTime() -
      Math.min(last_scraped_nebula.getTime(), last_scraped_youtube.getTime()) >
      14400000
  ) {
    logger.log("Match: Creator scraped more than 4 hours ago, scraping again");
    try {
      await videosFromNebula(channel_slug, true);
      await videosFromYoutube(channel_slug, true);
    } catch (error) {
      logger.error("Match: Error scraping videos");
      throw error;
    }
  }

  // Get creator's youtube videos
  const youtube_videos: YoutubeVideo[] = await creator.getYoutubeVideos(
    rematch_yt_id
  );
  // Get creator's nebula videos
  const nebula_videos: NebulaVideos[] = await creator.getNebulaVideos(
    rematch_nebula_slug
  );

  // Match youtube videos to nebula videos
  logger.info(
    `Match: Matching ${youtube_videos.length} youtube videos against ${nebula_videos.length} nebula videos`
  );

  // --- Matcher Function ---
  const matchedArray = await matcher(nebula_videos, youtube_videos);

  // Remove null values
  const matched_videos = matchedArray.filter((video): video is any => {
    return video !== undefined;
  });

  if (matched_videos.length === 0) {
    logger.error(`Match: No videos matched for ${channel_slug}`);
    return;
  }
  // logger.verbose(matched_videos);
  logger.info(
    `Match: Found ${matched_videos.length} possible matched videos for ${channel_slug}`
  );

  // Send matches to database
  matched_videos.forEach(async (matched_video: any) => {
    logger.verbose(matched_video);
    const { youtube_video, nebula_video, score } = matched_video;
    if (!youtube_video?.videoId || youtube_video.videoId === "") {
      // Youtube video id is null or empty, skip
      return;
    }

    // Update the matched video in the database if the score is less than the previous match_strength
    const res = await NebulaVideos.findOneAndUpdate(
      {
        $or: [
          {
            $and: [
              { _id: nebula_video._id },
              { match_strength: { $gt: score } },
            ],
          },
          {
            $and: [{ _id: nebula_video._id }, { matched: false }],
          },
        ],
      },
      {
        matched: true,
        match_strength: score,
        youtube_video_id: youtube_video.videoId,
        youtube_video_object_id: youtube_video._id,
      }
    );
    logger.verbose(res);
  });
  return;
};

export default matchVideos;

// //#region Get Nebula Videos
// const getNebulaVideos = async (
//   channel_slug: string,
//   creator: CreatorType,
//   rematch_nebula_slug?: Array<string>
// ) => {
//   let nebula_videos: NebulaVideos[] = [];
//   // Get specific nebula video/videos if passed in
//   if (rematch_nebula_slug) {
//     const specificNebVideos = await NebulaVideos.find({
//       slug: { $in: rematch_nebula_slug },
//     }).select("title id slug");
//     if (specificNebVideos && specificNebVideos.length > 0) {
//       nebula_videos.push(...specificNebVideos);
//     } else {
//       throw new Error(
//         `Match: Nebula video ${rematch_nebula_slug} not found in DB`
//       );
//     }
//   }

//   // Get all nebula videos if no specific video was passed in
//   if (!rematch_nebula_slug) {
//     nebula_videos = await NebulaVideos.find({
//       _id: {
//         $in: creator.nebula_videos?.map((video: any) => {
//           return video._id;
//         }),
//       },
//     }).select("title id slug");
//     if (!nebula_videos) {
//       throw new Error(`Match: No nebula videos found for ${channel_slug}`);
//     }
//   }
// };
// //#region Get Youtube Videos
// const getYoutubeVideos = async (
//   channel_slug: string,
//   creator: CreatorType,
//   rematch_yt_id?: Array<string>
// ) => {
//   let youtube_videos: YoutubeVideos[] = [];

//   // Get specific youtube video/videos if passed in
//   if (rematch_yt_id) {
//     const specificYtVideos = await YoutubeVideos.find({
//       youtube_id: { $in: rematch_yt_id },
//     }).select("title videoId");
//     if (specificYtVideos && specificYtVideos.length > 0) {
//       youtube_videos.push(...specificYtVideos);
//     } else {
//       throw new Error(`Match: Youtube video ${rematch_yt_id} not found in DB`);
//     }
//     return youtube_videos;
//   }

//   // Get all youtube videos if no specific video was passed in
//   else if (!rematch_yt_id) {
//     youtube_videos = await YoutubeVideos.find({
//       _id: {
//         $in: creator.youtube_videos?.map((video: any) => {
//           return video._id;
//         }),
//       },
//     }).select("title videoId");
//     if (!youtube_videos) {
//       throw new Error(`Match: No youtube videos found for ${channel_slug}`);
//     }
//     // logger.info(`Match: Found ${youtube_videos.length} youtube videos`);
//     return youtube_videos;
//   } else {
//     throw new Error(`Match: No youtube videos found for ${channel_slug}`);
//   }
// };

//#region  --- Matcher Function ---
// Match videos to each other
const matcher = async (
  nebula_videos: Array<NebulaVideos>,
  youtube_videos: Array<YoutubeVideos>
) => {
  const fuse = new Fuse(youtube_videos, {
    keys: ["title"],
    threshold: 0.25,
    distance: 50,
    shouldSort: true,
    includeScore: true,
  });

  let match_sets: Array<MatchResult> = [];

  nebula_videos.forEach((nebula_video: NebulaVideos) => {
    if (!nebula_video.title) return;

    // Match youtube videos to nebula videos using fuse.js sorted by score
    const youtube_matches = fuse.search(nebula_video.title);

    // if there are matches, add them to the match_sets
    if (youtube_matches.length > 0) {
      match_sets.push({
        nebula_video: nebula_video,
        youtube_matches: youtube_matches.map(
          (match: Fuse.FuseResult<YoutubeVideo>) => {
            return {
              youtube_video: match.item,
              score: match.score,
            } as YoutubeMatches;
          }
        ),
      });
    }
    return;
  });

  return match_sets;
};

interface YoutubeMatches {
  youtube_video: YoutubeVideos;
  score: number;
}

interface MatchResult {
  nebula_video: NebulaVideos;
  youtube_matches: Array<YoutubeMatches>;
}

//#endregion --- Matcher Function ---
