const fs = require("fs");
const path = require("path");
// const crypto = require("crypto");
import { v4 as uuidv4 } from "uuid";
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
  id: string;
}

const serveLookupTable = async (
  maximum_table_age?: number,
  version?: string,
  maximumMatchDistance?: number
): Promise<LookupTable | true> => {
  logger.info("Table Serve: serving lookup table");
  if (maximum_table_age === undefined) maximum_table_age = 60;

  // Check how old the lookup table is
  const lookupTablePath = path.join(__dirname, "/lookup_table.json");
  const lookupTableExists = await fs.existsSync(lookupTablePath);

  // If the lookup table doesn't exist, create it
  if (!lookupTableExists) {
    logger.warn("Table Serve: lookup table does not exist");
    return await generateLookupTable(maximumMatchDistance);
  }

  const lookupTable = JSON.parse(fs.readFileSync(lookupTablePath, "utf8"));

  const lookupTableAge =
    new Date().getTime() - Date.parse(lookupTable.generatedAt);

  // If the lookup table is too old, regenerate it and return it
  if (lookupTableAge > maximum_table_age * 60 * 1000) {
    logger.warn(
      `Table Serve: Table age: ${Math.round(
        lookupTableAge / 60 / 1000
      )} | Max ${maximum_table_age} | regenerate`
    );
    return generateLookupTable(maximumMatchDistance);
  } else {
    logger.debug(
      `Table Serve: Table age: ${Math.round(
        lookupTableAge / 60 / 1000
      )} | Max ${maximum_table_age} | use existing`
    );

    // If an id is provided, check if it is different from the current one
    if (version && version == lookupTable.id) {
      logger.debug(
        `Table Serve: Table version: ${version} | ${lookupTable.id} | table is up to date`
      );
      return true;
    }
    return lookupTable;
  }
};
export default serveLookupTable;

const generateLookupTable = async (maximumMatchDistance?: number) => {
  const matchLimit = maximumMatchDistance || 2;
  const nebulaVideos = await NebulaVideo.find({
    youtube_video_id: { $exists: true },
    match_strength: { $lte: matchLimit },
  })
    .select("youtube_video_object_id channel_slug")
    .lean();
  logger.debug(
    `Table Serve: Found ${nebulaVideos.length} matched nebula videos`
  );
  // Get all youtube videos
  const youtubeVideos = await YoutubeVideo.find({})
    .select("youtube_video_id channel_slug")
    .lean();
  logger.debug(`Table Serve: Found ${youtubeVideos.length} youtube videos`);

  const creatorSlugs = [...new Set(nebulaVideos.map((v) => v.channel_slug))];
  logger.debug(`Table Serve: Found ${creatorSlugs.length} creators`);

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

  logger.debug(`Table Serve: Generating lookup table hash`);
  // Generate Cryptographic Hash
  // const privatePem = fs.readFileSync(path.join(__dirname, "/key.pem"));
  // const key = privatePem.toString();
  // const sign = crypto.createSign("RSA-SHA256");
  // const sign = crypto.createHash("sha256");
  // sign.update(JSON.stringify(lookup_prototype));
  // const sig = sign.sign(key, "hex");
  const id = uuidv4();

  const table: LookupTable = {
    ...lookup_prototype,
    id,
  };

  logger.debug(`Table Serve: Saving lookup table`);
  await fs.promises.writeFile(
    path.join(__dirname, "/lookup_table.json"),
    JSON.stringify(table),
    "utf-8"
  );
  logger.verbose(table);
  return table;
};
