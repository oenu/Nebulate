import type { discrepancy } from "../models/channel/methods/checkConfig";
// rechecks channel information from nebula and youtube, provides a summary of any changes

import { Channel } from "../models/channel/channel";
import logger from "../utils/logger";

export const checkAllConfigs = async (): Promise<void> => {
  // Get all channels from mongodb
  const channels = await Channel.find({}).select([
    "-nebulaVideos",
    "-youtubeVideos",
  ]);

  if (!channels) {
    throw new Error("No channels found");
  }

  const channelDiscrepancies: { [key: string]: discrepancy }[] = [];

  // Loop through each channel and call the checkConfig method
  for await (const channel of channels) {
    await channel
      .checkConfig()
      .then((discrepancy) => {
        channelDiscrepancies.push(discrepancy);
        if (!discrepancy) {
          logger.info(`Channel ${channel.slug} is up to date`);
        }
      })
      .catch((err) => {
        logger.error(err);
      });
  }

  // Log the results in a readable format to the verbose console
  logger.verbose(`
    ${channelDiscrepancies.length} channels had discrepancies out of ${channels.length} total channels`);
  channelDiscrepancies.forEach((discrepancy) => {
    logger.verbose(
      `[${discrepancy.platform}:${discrepancy.field}] (Stored) ${discrepancy.db_value} !== ${discrepancy.api_value} (api)`
    );
  });
};
