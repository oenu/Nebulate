import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import videosFromYoutube from "../scrapers/videosFromYoutube";

app.put(
  "/:channel_slug/:onlySearchNew?/:videoScrapeLimit?",
  async (req: Request, res: Response) => {
    const channel_slug = req.params.channel_slug;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const videoScrapeLimit = req.params.videoScrapeLimit
      ? parseInt(req.params.videoScrapeLimit)
      : 10;

    if (!channel_slug) {
      res.send("No channel_slug provided");
      logger.error("No channel_slug provided");
      return;
    }

    try {
      await videosFromYoutube(channel_slug, onlySearchNew, videoScrapeLimit);
      res.send(`Scraped ${channel_slug}`);
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
