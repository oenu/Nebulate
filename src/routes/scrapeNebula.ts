import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import videosFromNebula from "../scrapers/videosFromNebula";

app.put(
  "/:channel_slug/:onlySearchNew?/:searchLimit?",
  async (req: Request, res: Response) => {
    const { channel_slug } = req.params;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const searchLimit = req.params.searchLimit
      ? parseInt(req.params.searchLimit)
      : 10;

    if (!channel_slug) {
      res.send("No channel_slug provided");
      logger.error("No channel_slug provided");
      return;
    }

    try {
      await videosFromNebula(channel_slug, onlySearchNew, searchLimit);
    } catch (error) {
      logger.error(error);
    }
    res.send(`Updated ${channel_slug}`);
  }
);

module.exports = app;
