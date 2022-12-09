import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
import { Channel } from "../models/channel/channel";
const app = express();

// Route for handling a request to check a channel's config
app.put("/:channelSlug", async (req: Request, res: Response) => {
  const channelSlug = req.params.channelSlug;

  if (!channelSlug) {
    res.send("No channelSlug provided");
    logger.error("No channelSlug provided");
    return;
  }

  // Get the channel from the database
  const channel = await Channel.findOne({ slug: channelSlug });

  // If the channel doesn't exist, return an error
  if (!channel) {
    res.status(400).send(`Channel ${channelSlug} not found`);
    logger.error("Channel not found");
    return;
  }

  // If the channel exists, check the channel's config
  try {
    await channel
      .checkConfig()
      .then((result) => {
        // If there are no discrepancies, return a success message
        if (Object.keys(result).length === 0) {
          res.status(200).send(`Channel ${channelSlug} config is up to date`);
          logger.info(`Channel ${channelSlug} config is up to date`);
          return;
        } else {
          // Create a human readable summary of the discrepancies (field: local value, api value)
          const discrepancies = Object.keys(result).map((key) => {
            return `[${result[key]?.platform}:${key}] (Stored) ${result[key]?.db_value} !== ${result[key]?.api_value} (api)`;
          });

          // Return the summary of the discrepancies
          res.status(200).send(
            `Channel ${channelSlug} config is not up to date: discrepancies
            ${discrepancies.join(", ")}.`
          );
          logger.verbose(channelSlug, discrepancies.join(", "));
          return;
        }
      })
      .catch((error) => {
        res.status(400).send(`Error checking config: ${error}`);
        logger.error(`Error checking config: ${error}`);
        return;
      });
  } catch (error) {
    logger.error(error);
  }
});

module.exports = app;
