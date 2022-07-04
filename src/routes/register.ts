import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import register from "../channel/register";
import matchVideos from "../channel/match";

app.put("/:channelSlug", async (req: Request, res: Response) => {
  const { channelSlug } = req.params;

  if (!channelSlug) {
    res.send("No channelSlug provided");
    logger.error("No channelSlug provided");
    return;
  }

  try {
    await register(channelSlug);
    res.status(201).send(`Registered ${channelSlug}`);

    await matchVideos(channelSlug);
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
