import express from "express";
import type { Response } from "express";
const app = express();

import { NebulaVideo } from "../models/nebulaVideo";

app.get("/lookup/:youtube_video_id", async (_req, res: Response) => {
  const youtube_video_id = _req.params.youtube_video_id;
  if (!youtube_video_id) {
    res.send("No youtube_video_id provided");
  } else {
    const video = await NebulaVideo.findOne({
      youtube_video_id: youtube_video_id,
    }).lean();
    if (video) {
      res.send(video.slug);
    }
  }
});

module.exports = app;
