import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import register from "../channel/register";
import matchVideos from "../channel/match";

app.put("/:channel_slug", async (req: Request, res: Response) => {
  const { channel_slug } = req.params;

  if (!channel_slug) {
    res.send("No channel_slug provided");
    logger.error("No channel_slug provided");
    return;
  }

  try {
    await register(channel_slug);
    res.status(201).send(`Registered ${channel_slug}`);

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
