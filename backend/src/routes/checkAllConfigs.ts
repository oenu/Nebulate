import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
import { Channel } from "../models/channel/channel";
import { checkAllConfigs } from "../batch/checkAllConfigs";
const app = express();

// Route for handling a request to check all channels' configs
app.put("/", async (_req: Request, res: Response) => {
  // Make sure that some channels exist
  const channels = await Channel.find({}).select("slug").lean();

  // If there are no channels, return an error
  if (!channels) {
    res.status(400).send("No channels found");
    logger.error("No channels found");
    return;
  }

  // If there are channels, call the checkAllConfig function
  try {
    checkAllConfigs();
  } catch (error) {
    logger.error(error);
  }
  res.send(
    `Updating ${channels.length} channels, check the logs for more info`
  );
});

module.exports = app;
