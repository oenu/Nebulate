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

  // Loop through each channel and call the checkConfig method
  for await (const channel of channels) {
    await channel
      .checkConfig()
      .then((discrepancy) => {
        if (!discrepancy) {
          logger.info(`Channel ${channel.slug} is up to date`);
        } else {
          // logger.info (`[${discrepancy[key]} : ${discrepancy[key]?.platform}] ${key} has changed from ${value.db_value} to ${value.api_value}`)
          if (discrepancy) {
            for (const [key, value] of Object.entries(discrepancy)) {
              logger.info(
                `[${discrepancy[key]?.field} : ${discrepancy[key]?.platform}] ${key} has changed from ${value.db_value} to ${value.api_value}`
              );
            }
          }
        }
      })
      .catch((err) => {
        logger.error(err);
      });
  }
};
