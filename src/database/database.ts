// Gathers data from the database and creates a copy for distribution to the clients

const fs = require("fs");
const path = require("path");

import logger from "../config/logger";
import { NebulaVideo } from "../models/nebulaVideo";
import { YoutubeVideo } from "../models/youtubeVideo";

interface videoPair {
  url: string;
  slug: string;
}

interface extensionDatabase {
  videoPairs: videoPair[];
  unmatchedVideos: string[];
  hash: string;
  generatedAt: Date;
}

const generateDatabase = async (): Promise<extensionDatabase> => {
  // Get all nebula videos
  const nebulaVideos = await NebulaVideo.find({
    matched: true,
    youtube_video_id: { $exists: true },
  }).select("youtube_video_object_id slug creator_object_id");

  // Get up to date url for each video
  const matched_pairs: Promise<videoPair | undefined>[] = await nebulaVideos
    .map(async (video): Promise<videoPair | undefined> => {
      const youtube_url = await YoutubeVideo.findById(
        video.youtube_video_object_id
      ).select("youtube_video_id");
      if (youtube_url) {
        return {
          url: youtube_url.youtube_video_id,
          slug: video.slug,
        };
      } else {
        return;
      }
    })
    .filter((pair) => pair !== undefined);

  logger.verbose(matched_pairs);
};
