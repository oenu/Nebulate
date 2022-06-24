import logger from "../config/logger";
import Fuse from "fuse.js";

// Functions
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";

// Types
import type { NebulaVideoType } from "../models/nebulaVideo";
import type { YoutubeVideoType } from "../models/youtubeVideo";

// Mongo Models

interface YoutubeMatches {
  youtube_video: YoutubeVideoType;
  score: number;
}

interface MatchResult {
  nebula_video: NebulaVideoType;
  youtube_matches: Array<YoutubeMatches>;
}

// Mongo Models
import { Creator } from "../models/creator";
import { NebulaVideo } from "../models/nebulaVideo";
// import mongoose from "mongoose";

const matchVideos = async (
  channel_slug: string,
  rematch_nebula_slug?: Array<string>,
  rematch_yt_id?: Array<string>
) => {
  logger.info(`Match: Matching videos for ${channel_slug}`);
  // Check for creator slug
  if (await !Creator.exists({ slug: channel_slug })) {
    throw new Error(`Match: Creator ${channel_slug} doesn't exist in database`);
  }

  // Get creator
  const creator = await Creator.findOne({ slug: channel_slug });
  if (!creator) {
    throw new Error(`Match: Creator ${channel_slug} not found in DB`);
  }

  // Check the last time the creator's nebula videos were scraped
  // If the creator's videos were scraped more than 4 hours ago, scrape them again
  const { last_scraped_nebula, last_scraped_youtube } = creator;
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
  const youtube_videos: YoutubeVideoType[] = await creator.getYoutubeVideos(
    rematch_yt_id
  );
  // Get creator's nebula videos
  const nebula_videos: NebulaVideoType[] = await creator.getNebulaVideos(
    rematch_nebula_slug
  );

  logger.info(
    `Match: Matching ${youtube_videos.length} youtube videos against ${nebula_videos.length} nebula videos`
  );

  // --- Matcher Function ---
  const matched_videos = await matcher(nebula_videos, youtube_videos);

  if (matched_videos.length === 0) {
    logger.error(`Match: No videos matched for ${channel_slug}`);
    return;
  } else {
    logger.info(
      `Match: Found ${matched_videos.length} possible matched videos for ${channel_slug}`
    );
  }



  matched_videos.forEach(async (match_set: MatchResult) => {
    const { nebula_video, youtube_matches } = match_set;

    // Try to prevent matching one youtube video to multiple nebula videos
    if (youtube_matches[0]?.youtube_video.matched === true && youtube_matches[0]?.youtube_video?.match_strength) {
      logger.info( "Match: Found a matched video that was already matched, comparing scores");
      if (youtube_matches[0].score < youtube_matches[0]?.youtube_video?.match_strength) {
        logger.warn("Match: New video has better score, replacing old video");
        
        







  if (matched_videos[0]?.youtube_matches[0]?.score) {
    console.log(typeof matched_videos[0]?.youtube_matches[0]);
    // console.log(matched_videos[0]?.youtube_matches[0].youtube_video.);
    updateVideo(
      matched_videos[0]?.nebula_video,
      matched_videos[0]?.youtube_matches[0]?.youtube_video,
      matched_videos[0]?.youtube_matches[0]?.score
    );
  }
};

//     if (youtube_videos.length === 0) {
//       // This shouldnt be possible due to the matcher function
// return;
//     } else if (youtube_videos.length === 1) {
//       // If there is only one youtube video, check to see if it is a better match than the current one
//       const youtube_video = youtube_videos[0];

//     if (!youtube_video?.videoId || youtube_video.videoId === "") {
//       // Youtube video id is null or empty, skip
//       return;
//     }
//     // Update the matched video in the database if the score is less than the previous match_strength

//     logger.verbose(res);
//   });
//   return;
// };

export default matchVideos;

//#region  --- Matcher Function ---
// Match videos to each other
const matcher = async (
  nebula_videos: Array<NebulaVideoType>,
  youtube_videos: Array<YoutubeVideoType>
): Promise<MatchResult[]> => {
  const fuse = new Fuse(youtube_videos, {
    keys: ["title"],
    threshold: 0.25,
    distance: 50,
    shouldSort: true,
    includeScore: true,
  });

  let match_sets: Array<MatchResult> = [];

  nebula_videos.forEach((nebula_video: NebulaVideoType) => {
    if (!nebula_video.title) return;

    // Match youtube videos to nebula videos using fuse.js sorted by score
    const youtube_matches = fuse.search(nebula_video.title);

    // if there are matches, add them to the match_sets
    if (youtube_matches.length > 0) {
      match_sets.push({
        nebula_video: nebula_video,
        youtube_matches: youtube_matches.map(
          (match: Fuse.FuseResult<YoutubeVideoType>) => {
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

  // Filter out empty match sets
  match_sets = match_sets.filter((video): video is any => {
    return video !== undefined;
  });

  return match_sets;
};

//#endregion --- Matcher Function ---

//#region --- Update Video Function ---
const updateVideo = async (
  nebula_video: NebulaVideoType,
  youtube_video: YoutubeVideoType,
  score: number
) => {
  const res = await NebulaVideo.findOneAndUpdate(
    { _id: nebula_video._id },
    {
      matched: true,
      match_strength: score,
      youtube_video_id: youtube_video.youtube_video_id,
      youtube_video_object_id: youtube_video._id,
    }
  );
  return res;
};

// const updateVideo = async ( nebula_video: NebulaVideoType, youtube_video: YoutubeVideoType  ) => {
// const res = await NebulaVideo.findOneAndUpdate(
//       {
//         $or: [
//           {
//             $and: [
//               { "_id": "nebula_video._id" },
//               { match_strength: { $gt: score } },
//             ],
//           },
//           {
//             $and: [{ _id: nebula_video._id }, { matched: false }],
//           },
//         ],
//       },
//       {
//         matched: true,
//         match_strength: score,
//         youtube_video_id: youtube_video.videoId,
//         youtube_video_object_id: youtube_video._id,
//       }
//     );

//#endregion --- Update Video Function ---
