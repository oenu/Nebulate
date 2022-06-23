import logger from "../config/logger";
import { Creator } from "../models/creator";
import videosFromNebula from "./videosFromNebula";
import videosFromYoutube from "./videosFromYoutube";
import { YoutubeVideo as YoutubeVideos } from "../models/youtubeVideo";
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
  rematch_all?: boolean,
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
  let youtube_videos: YoutubeVideos[] = [];
  // Get specific youtube video/videos if passed in
  if (rematch_yt_id && !rematch_all) {
    const specificYtVideos = await YoutubeVideos.find({
      youtube_id: { $in: rematch_yt_id },
    }).select("title videoId");
    if (specificYtVideos && specificYtVideos.length > 0) {
      youtube_videos.push(...specificYtVideos);
    } else {
      throw new Error(`Match: Youtube video ${rematch_yt_id} not found in DB`);
    }
  }

  // Get all youtube videos if no specific video was passed in
  if (!rematch_yt_id || rematch_all) {
    youtube_videos = await YoutubeVideos.find({
      _id: {
        $in: creator.youtube_videos?.map((video: any) => {
          return video._id;
        }),
      },
    }).select("title videoId");
    if (!youtube_videos) {
      throw new Error(`Match: No youtube videos found for ${channel_slug}`);
    }
    logger.info(`Match: Found ${youtube_videos.length} youtube videos`);
  }

  // Get creator's nebula videos
  let nebula_videos: NebulaVideos[] = [];
  // Get specific nebula video/videos if passed in
  if (rematch_nebula_slug && !rematch_all) {
    const specificNebVideos = await NebulaVideos.find({
      slug: { $in: rematch_nebula_slug },
    }).select("title id slug");
    if (specificNebVideos && specificNebVideos.length > 0) {
      nebula_videos.push(...specificNebVideos);
    } else {
      throw new Error(
        `Match: Nebula video ${rematch_nebula_slug} not found in DB`
      );
    }
  }

  // Get all nebula videos if no specific video was passed in
  if (!rematch_nebula_slug || rematch_all) {
    nebula_videos = await NebulaVideos.find({
      _id: {
        $in: creator.nebula_videos?.map((video: any) => {
          return video._id;
        }),
      },
    }).select("title id slug");
    if (!nebula_videos) {
      throw new Error(`Match: No nebula videos found for ${channel_slug}`);
    }
  }

  logger.verbose(nebula_videos[0]);
  // Match youtube videos to nebula videos using fuse.js sorted by score
  const fuse = new Fuse(nebula_videos, {
    keys: ["title"],
    threshold: 0.25,
    distance: 50,
    shouldSort: true,
    includeScore: true,
  });

  // Match youtube videos to nebula videos
  const matched_videos = youtube_videos.map((youtube_video: any) => {
    const match = fuse.search(youtube_video.title);
    let bestMatch: any = {};
    if (match.length === 0) {
      // No match returned from fuse.js, return null
      return;
    } else if (match.length === 1) {
      bestMatch = match[0];
      // If there is only one match, return it regardless of whether it has already been matched to any other video
    } else if (match.length > 1) {
      // If there are multiple matches, rank them by match and score and return the best match
      const previouslyUnmatched = match.filter((match: any) => {
        return !match.item.matched;
      });

      // If there are no previously unmatched matches, return the first video
      if (previouslyUnmatched.length > 0) {
        bestMatch = previouslyUnmatched[0];
      } else {
        // If removing matched videos returns no videos, return the first original video regardless of whether it has already been matched to any other video
        bestMatch = match[0];
      }
    } else {
      throw new Error(
        `Match: Error matching youtube video ${youtube_video.videoId}`
      );
    }
    if (bestMatch.item) {
      logger.info("Item matched with score: " + bestMatch.score);
      return {
        youtube_video: bestMatch.item,
        nebula_video: nebula_videos[bestMatch.refIndex],
        score: bestMatch.score,
      };
    } else {
      return;
    }
  });

  if (matched_videos.length === 0) {
    logger.error(`Match: No videos matched for ${channel_slug}`);
    return;
  }

  logger.info(`Match: Found ${matched_videos.length} possible matching videos`);
  logger.verbose(matched_videos);
};

export default matchVideos;
