import express from "express";
import type { Response, Request } from "express";
const app = express();

import { NebulaVideo } from "../models/nebulaVideo/nebulaVideo";
import logger from "../utils/logger";

app.get("/:youtubeVideoId", async (req: Request, res: Response) => {
  const youtubeVideoId = req.params.youtubeVideoId;
  logger.debug("Responding to req for " + youtubeVideoId);
  if (!youtubeVideoId) {
    res.send("No youtubeVideoId provided");
  } else {
    const video = await NebulaVideo.findOne({
      youtubeVideoId: youtubeVideoId,
    }).lean();
    if (video) {
      res.send(video.slug);
      logger.debug("redirect: " + youtubeVideoId + " -> " + video.channelSlug);
      return;
    } else {
      res.status(204).send("No video found");
      return;
    }
  }
});

module.exports = app;
