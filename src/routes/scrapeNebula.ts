import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import videosFromNebula from "../scrape/videosFromNebula";

app.put(
  "/:channelSlug/:onlySearchNew?/:searchLimit?",
  async (req: Request, res: Response) => {
    const { channelSlug } = req.params;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const searchLimit = req.params.searchLimit
      ? parseInt(req.params.searchLimit)
      : 10;

    if (!channelSlug) {
      res.send("No channelSlug provided");
      logger.error("No channelSlug provided");
      return;
    }

    try {
      await videosFromNebula(channelSlug, onlySearchNew, searchLimit);
    } catch (error) {
      logger.error(error);
    }
    res.send(`Updated ${channelSlug}`);
  }
);

module.exports = app;
