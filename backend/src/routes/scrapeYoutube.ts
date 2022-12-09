import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import videosFromYoutube from "../scrape/videosFromYoutube";

app.put(
  "/:channelSlug/:onlySearchNew?/:videoScrapeLimit?",
  async (req: Request, res: Response) => {
    const channelSlug = req.params.channelSlug;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const videoScrapeLimit = req.params.videoScrapeLimit
      ? parseInt(req.params.videoScrapeLimit)
      : 10;

    if (!channelSlug) {
      res.send("No channelSlug provided");
      logger.error("No channelSlug provided");
      return;
    }

    try {
      await videosFromYoutube(channelSlug, onlySearchNew, videoScrapeLimit);
      res.send(`Scraped ${channelSlug}`);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message) {
        res.send(error.message);
      } else {
        res.send(error);
      }
    }
  }
);

module.exports = app;
