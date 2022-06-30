import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import matchVideos from "../server_functions/matchVideos";

app.get(
  "/:channel_slug/:rematch_nebula_slug?/:rematch_yt_id?",
  async (req: Request, res: Response) => {
    const channel_slug = req.params.channel_slug;

    const rematch_nebula_slug = req.params?.rematch_nebula_slug
      ? [req.params.rematch_nebula_slug]
      : undefined;
    const rematch_yt_id = req.params?.rematch_yt_id
      ? [req.params.rematch_yt_id]
      : undefined;

    if (!channel_slug) {
      res.send("No channel_slug provided");
      logger.error("No channel_slug provided");
      return;
    }
    try {
      await matchVideos(channel_slug, rematch_nebula_slug, rematch_yt_id);

      res.send(`Matched ${channel_slug}`);
    } catch (error: any) {
      logger.error(error.message);
      throw error;
    }
  }
);

module.exports = app;
