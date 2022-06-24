// Gathers data from the database and creates a copy for distribution to the clients

const fs = require("fs");
const path = require("path");

import { NebulaVideo } from "../models/nebulaVideo";

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
  }).select("youtube_video_id slug");

  // Separate out the videos that have a match

  return;
};
