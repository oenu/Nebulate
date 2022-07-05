import express from "express";
import type { Response, Request } from "express";
const app = express();

import { NebulaVideo } from "../models/nebulaVideo/nebulaVideo";

app.get("/:youtubeVideoId", async (req: Request, res: Response) => {
  console.time("lookup");
  const youtubeVideoId = req.params.youtubeVideoId;
  console.log("Responding to req for " + youtubeVideoId);
  if (!youtubeVideoId) {
    res.send("No youtubeVideoId provided");
  } else {
    const video = await NebulaVideo.findOne({
      youtubeVideoId: youtubeVideoId,
    }).lean();
    if (video) {
      res.send(video.slug);
    } else {
      res.status(204).send("No video found");
    }
  }
  console.timeEnd("lookup");
});

module.exports = app;
