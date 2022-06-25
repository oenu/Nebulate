const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

import logger from "../config/logger";

import { NebulaVideo } from "../models/nebulaVideo";
import { YoutubeVideo } from "../models/youtubeVideo";

interface CreatorEntry {
  matched: string[];
  not_matched: string[];
  slug: string;
}

interface LookupTable {
  creators: CreatorEntry[];
  generatedAt: Date;
  hash: string;
}

const generateLookupTable = async (
  maximumMatchDistance?: number
): Promise<LookupTable> => {
  console.time("generateLookupTable");
  // Get all matched nebula videos
  const matchLimit = maximumMatchDistance || 2;
  const nebulaVideos = await NebulaVideo.find({
    youtube_video_id: { $exists: true },
    match_strength: { $lte: matchLimit },
  })
    .select("youtube_video_object_id channel_slug")
    .lean();
  logger.info(`Table Gen: Found ${nebulaVideos.length} matched nebula videos`);
  // Get all youtube videos
  const youtubeVideos = await YoutubeVideo.find({})
    .select("youtube_video_id channel_slug")
    .lean();
  logger.info(`Table Gen: Found ${youtubeVideos.length} youtube videos`);

  const creatorSlugs = [...new Set(nebulaVideos.map((v) => v.channel_slug))];
  logger.info(`Table Gen: Found ${creatorSlugs.length} creators`);

  const videoEntries = youtubeVideos.map((youtubeVideo) => {
    return {
      url: youtubeVideo.youtube_video_id,
      slug: youtubeVideo.channel_slug,
      matched: nebulaVideos.some((nebulaVideo) => {
        return nebulaVideo.youtube_video_object_id
          ? nebulaVideo.youtube_video_object_id.toString() ===
              youtubeVideo._id.toString()
          : false;
      }),
    };
  });

  const lookup_prototype = {
    generatedAt: new Date(),
    creators: creatorSlugs.map<CreatorEntry>((creatorSlug) => {
      const creatorVideos = videoEntries.filter((v) => v.slug === creatorSlug);
      const matched = creatorVideos.filter((v) => v.matched);
      const notMatched = creatorVideos.filter((v) => !v.matched);
      return {
        matched: matched.map((v) => v.url),
        not_matched: notMatched.map((v) => v.url),
        slug: creatorSlug,
      };
    }),
  };

  logger.info(`Table Gen: Generating lookup table hash`);
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

  logger.info(`Table Gen: Saving lookup table`);
  await fs.promises.writeFile(
    path.join(__dirname, "/lookup_table.json"),
    JSON.stringify(table),
    "utf-8"
  );
  logger.verbose(table);
  console.timeEnd("generateLookupTable");
  return table;
};

export default generateLookupTable;
