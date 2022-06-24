import logger from "../config/logger";
import Fuse from "fuse.js";

// Functions
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";

// Types
import type { NebulaVideoType } from "../models/nebulaVideo";
import type { YoutubeVideoType } from "../models/youtubeVideo";

// Mongo Models
import { Creator } from "../models/creator";
import { NebulaVideo } from "../models/nebulaVideo";

/**
 * Match Nebula videos to Youtube videos, from the database
 * @param  {string} channel_slug - The channel slug
 * @param  {Array.<string>} rematch_nebula_slug? - The slug of the video to rematch
 * @param  {Array.<string>} rematch_yt_id? - The youtube id of the video to rematch
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
    const res = await NebulaVideo.findOneAndUpdate(
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

//#region  --- Matcher Function ---
// Match videos to each other
const matcher = async (
  nebula_videos: Array<NebulaVideoType>,
  youtube_videos: Array<YoutubeVideoType>
) => {
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

  return match_sets;
};

interface YoutubeMatches {
  youtube_video: YoutubeVideoType;
  score: number;
}

interface MatchResult {
  nebula_video: NebulaVideoType;
  youtube_matches: Array<YoutubeMatches>;
}

//#endregion --- Matcher Function ---
