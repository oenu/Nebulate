import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import updateAll from "../batch/updateAll";

// Mongo Models
import { Channel } from "../models/channel/channel";

app.put("/", async (_req: Request, res: Response) => {
  try {
    const channels = await Channel.find({}).select(
      "lastScrapedNebula lastScrapedYoutube lastMatched slug"
    );
    if (channels.length === 0) {
      logger.error("UpdateAll: No channels found to update");
      res.status(204).send("No channels found to update");
    } else {
      logger.info(`UpdateAll: Updating ${channels.length} channels`);
      updateAll();
      res.status(200).send("Updating all channels...");
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send("Error updating channels");
  }
});

module.exports = app;
