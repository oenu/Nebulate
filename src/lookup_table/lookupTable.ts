const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

import logger from "../config/logger";

import { NebulaVideo } from "../models/nebulaVideo";
import { YoutubeVideo } from "../models/youtubeVideo";

interface VideoEntry {
  url: string;
  channel_slug: string;
  matched: boolean;
}

interface LookupTable {
  videos: VideoEntry[];
  unmatchedVideos: string[];
  hash: string;
  generatedAt: Date;
}

const generateLookupTable = async (): Promise<LookupTable> => {
  // Get all nebula videos
  const nebulaVideos = await NebulaVideo.find({
    matched: true,
    youtube_video_id: { $exists: true },
  }).select("youtube_video_object_id slug creator_object_id");

  // Get up to date url for each video

  let videoPairs: VideoEntry[] = [];
  for (let index = 0; index < nebulaVideos.length; index++) {
    const video = nebulaVideos[index];
    if (!video?.youtube_video_object_id) continue;

    const youtube_url = await YoutubeVideo.findById(
      video.youtube_video_object_id
    ).select("youtube_video_id");

    if (youtube_url) {
      videoPairs.push({
        url: youtube_url.youtube_video_id,
        slug: video.slug,
      });
    }
  }

  const unmatchedVideos = await YoutubeVideo.find({
    matched: false,
    youtube_video_id: { $exists: true },
  }).select("youtube_video_id");

  const database_prototype = {
    videoPairs: videoPairs,
    unmatchedVideos: unmatchedVideos.map((video) => video.youtube_video_id),
    generatedAt: new Date(),
  };

  // Generate Cryptographic Hash
  const privatePem = fs.readFileSync(path.join(__dirname, "/key.pem"));
  const key = privatePem.toString();
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(JSON.stringify(database_prototype));
  const sig = sign.sign(key, "hex");

  const database: extensionDatabase = {
    ...database_prototype,
    hash: sig,
  };
  await fs.promises.writeFile(
    path.join(__dirname, "/simple_key.json"),
    JSON.stringify(database),
    "utf-8"
  );
  logger.verbose(database);
  return database;
};
