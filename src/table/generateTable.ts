import fs = require("fs");
import path = require("path");
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";

// Mongoose Schema
import { NebulaVideo } from "../models/nebulaVideo/nebulaVideo";
import { YoutubeVideo } from "../models/youtubeVideo";

/**
 * @type {Object} ChannelEntry
 * @property {string[]} matched - A list of youtube video ids that have been matched to a nebula video
 * @property {string[]} not_matched - A list of youtube video ids that have not been matched to a nebula video
 * @property {string} slug - The channel slug of the channel that the videos belong to
 */
interface ChannelEntry {
  matched: string[];
  not_matched: string[];
  slug: string;
}

/**
 * @type {Object} LookupTable
 * @description A lookup table that maps youtube video ids to nebula video ids for each known channel. This table is generated by the server and is sent to the client to lookup videos before requesting a redirect from the server.
 * @property {string} generatedAt - The date the lookup table was generated
 * @property {ChannelEntry[]} channels - A list of channel entries {@link ChannelEntry}
 * @property {string} id - The id of the lookup table
 */
interface LookupTable {
  channels: ChannelEntry[];
  generatedAt: Date;
  id: string;
}

/**
 * @function generateTable
 * @description Generates a lookup table that maps youtube video ids to nebula video ids for each known channel. This table is generated by the server and is sent to the client to lookup videos before requesting a redirect from the server.
 * @param {number} maximumMatchDistance - The maximum distance between a youtube video and a nebula video to be considered a match. Lower is more strict.
 * @returns {Promise<LookupTable>} A lookup table
 * @throws {Error} If the lookup table cannot be generated

 * @async
 */

export const generateTable = async (maximumMatchDistance?: number) => {
  const matchLimit = maximumMatchDistance || 2;

  // Find all the nebula videos in the database
  const nebulaVideos = await NebulaVideo.find({
    youtubeVideoId: { $exists: true },
    matchStrength: { $lte: matchLimit },
  })
    .select("youtubeVideoObjectId channelSlug")
    .lean();
  logger.debug(
    `generateTable: Found ${nebulaVideos.length} matched nebula videos`
  );
  // Find all youtube videos in the database
  const youtubeVideos = await YoutubeVideo.find({})
    .select("youtubeVideoId channelSlug")
    .lean();
  logger.debug(`generateTable: Found ${youtubeVideos.length} youtube videos`);

  // Get a list of all the channels that have youtube videos in the database
  const channelSlugs = [...new Set(nebulaVideos.map((v) => v.channelSlug))];
  logger.debug(`generateTable: Found ${channelSlugs.length} channels`);

  // Create a useful data structure for the lookup table, with a list of youtube video ids for each channel
  const videoEntries = youtubeVideos.map((youtubeVideo) => {
    return {
      url: youtubeVideo.youtubeVideoId,
      slug: youtubeVideo.channelSlug,
      matched: nebulaVideos.some((nebulaVideo) => {
        return nebulaVideo.youtubeVideoObjectId
          ? nebulaVideo.youtubeVideoObjectId.toString() ===
              youtubeVideo._id.toString()
          : false;
      }),
    };
  });

  // Compress the data structure into a lookup table
  const lookup_prototype = {
    generatedAt: new Date(),
    channels: channelSlugs.map<ChannelEntry>((channelSlug) => {
      const channelVideos = videoEntries.filter((v) => v.slug === channelSlug);
      const matched = channelVideos.filter((v) => v.matched);
      const notMatched = channelVideos.filter((v) => !v.matched);
      return {
        matched: matched.map((v) => v.url),
        not_matched: notMatched.map((v) => v.url),
        slug: channelSlug,
      };
    }),
  };

  // Generate a new id and assign it to the lookup table
  const id = uuidv4();
  const table: LookupTable = {
    ...lookup_prototype,
    id,
  };

  // Write the lookup table to disk
  logger.debug(`generateTable: Saving lookup table`);
  await fs.promises.writeFile(
    path.join(__dirname, "/lookup_table.json"),
    JSON.stringify(table),
    "utf-8"
  );

  logger.info("generateTable: Lookup table generated");
  // Return the lookup table
  return table;
};

export default generateTable;
