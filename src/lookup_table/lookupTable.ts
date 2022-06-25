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
  hash: string;
  generatedAt: Date;
}

const generateLookupTable = async (
  maximumMatchDistance?: number
): Promise<LookupTable> => {
  // Get all matched nebula videos
  const matchLimit = maximumMatchDistance || 2;
  const nebulaVideos = await NebulaVideo.find({
    youtube_video_id: { $exists: true },
    match_strength: { $lte: matchLimit },
  }).select("youtube_video_object_id channel_slug");
  logger.info(`Table Gen: Found ${nebulaVideos.length} matched nebula videos`);

  // Get all youtube videos
  const youtubeVideos = await YoutubeVideo.find({
    youtube_video_id: { $exists: true },
  }).select("youtube_video_id channel_slug _id");
  logger.log(`Table Gen: Found ${youtubeVideos.length} youtube videos`);

  /** ===========================================================================
   * Note: We are not using the Matched property of the Nebula videos as
   *      the lookup table is only used to determine if a youtube video
   *     is a match for /any/ of the nebula videos. In other words, we
   *    are verifying that the youtube video is a match for at least one
   *   of the nebula videos and relying on the request for redirect to respond
   *  with the correct video.
   * ===========================================================================
   */

  const videoEntries = youtubeVideos.map((youtubeVideo): VideoEntry => {
    return {
      url: youtubeVideo.youtube_video_id,
      channel_slug: youtubeVideo.channel_slug,
      matched: nebulaVideos.some((nebulaVideo) => {
        return nebulaVideo.youtube_video_object_id
          ? nebulaVideo.youtube_video_object_id.toString() ===
              youtubeVideo._id.toString()
          : false;
      }),
    };
  });

  const lookup_prototype = {
    videos: videoEntries,
    generatedAt: new Date(),
  };

  // Generate Cryptographic Hash
  const privatePem = fs.readFileSync(path.join(__dirname, "/key.pem"));
  const key = privatePem.toString();
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(JSON.stringify(lookup_prototype));
  const sig = sign.sign(key, "hex");

  const table: LookupTable = {
    ...lookup_prototype,
    hash: sig,
  };
  await fs.promises.writeFile(
    path.join(__dirname, "/lookup_table.json"),
    JSON.stringify(table),
    "utf-8"
  );
  logger.verbose(table);
  return table;
};
