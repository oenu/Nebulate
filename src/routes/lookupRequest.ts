import express from "express";
import type { Response, Request } from "express";
const app = express();

import { NebulaVideo } from "../models/nebulaVideo";

app.get("/:youtubevideoid", async (req: Request, res: Response) => {
  console.time("lookup");
  const youtube_video_id = req.params.youtubevideoid;
  console.log("Responding to req for " + youtube_video_id);
  if (!youtube_video_id) {
    res.send("No youtube_video_id provided");
  } else {
    const video = await NebulaVideo.findOne({
      youtube_video_id: youtube_video_id,
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
