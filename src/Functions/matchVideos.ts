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
    logger.verbose(
      `Match: Found ${matched_videos.length} possible matched videos for ${channel_slug}`
    );
  }

  let modified_videos: {
    nebula_title: string;
    youtube_title: string;
    score: number;
  }[] = [];

  await matched_videos.forEach(async (match_set: MatchResult) => {
    const { nebula_video, youtube_matches } = match_set;
    // Try to prevent matching one youtube video to multiple nebula videos
    for (let index = 0; index < youtube_matches.length; index++) {
      let match = youtube_matches[index];
      if (match === undefined) return;

      const { youtube_video, score } = match;
      await nebula_video
        .updateMatch(youtube_video, score)
        .then(() => {
          modified_videos.push({
            nebula_title: nebula_video.title,
            youtube_title: youtube_video.title,
            score,
          });
          index = youtube_matches.length * 2;
        })
        .catch((error) => {
          if (error !== false) throw error;
        });
    }
  });

  // Sanity Check
  const sorted_array = modified_videos.sort((a: any, b: any) => {
    return b.score - a.score;
  });
  logger.verbose(sorted_array);
  logger.info("Match: Worst matches for " + channel_slug);
  logger.info(modified_videos.slice(0, 10));
  logger.verbose("Match: Worst matches for " + channel_slug);
  logger.verbose(modified_videos.slice(0, 10));

  return;
};
export default matchVideos;

//#region  --- Matcher Function ---
// Match videos to each other
const matcher = async (
  nebula_videos: Array<NebulaVideoType>,
  youtube_videos: Array<YoutubeVideoType>
): Promise<MatchResult[]> => {
  const fuse = new Fuse(youtube_videos, {
    keys: ["title"],
    threshold: 0.2,
    distance: 20,
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
