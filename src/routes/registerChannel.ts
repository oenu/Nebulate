import logger from "../config/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import registerCreatorInDB from "../Functions/registerCreatorInDB";
import matchVideos from "../Functions/matchVideos";

app.get("/:channel_slug", async (req: Request, res: Response) => {
  // TODO: Change to post
  const { channel_slug } = req.params;

  if (!channel_slug) {
    res.send("No channel_slug provided");
    logger.error("No channel_slug provided");
    return;
  }

  try {
    await registerCreatorInDB(channel_slug);
    res.send(`Registered ${channel_slug}`);

    await matchVideos(channel_slug);
  } catch (error: any) {
    logger.error(error.message);

    if (error.message) {
      res.send(error.message);
    } else {
      res.send(error);
    }
  }
});

module.exports = app;
