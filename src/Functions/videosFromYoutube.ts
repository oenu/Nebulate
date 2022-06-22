// Language: typescript
// Scrape youtube API to get videos for a creator

// import axios from "axios";
import logger from "../config/logger";
import { Creator } from "../models/creator";
import { youtube } from "@googleapis/youtube";

const yt = youtube("v3");

const videosFromYoutube = async (
  creatorSlug: string,
  videoScrapeLimit?: number
) => {
  // Check if creator exists
  if (await !Creator.exists({ slug: creatorSlug })) {
    throw new Error(`YtScrape: Creator ${creatorSlug} does not exist in DB`);
  }

  // Match the creator's slug to the creator's id
  const creator = await Creator.findOne({ slug: creatorSlug }).select(
    "youtube_upload_id"
  );
  console.log(creator);
  if (!creator) {
    logger.error(`YtScrape: Creator ${creatorSlug} does not have a youtube_id`);
    throw new Error(
      `YtScrape: Creator ${creatorSlug} does not have a youtube_id`
    );
  }

  // TODO: Get creators earliest video date on nebula and stop scraping before that date

  if (creator.youtube_upload_id && process.env.YOUTUBE_API_KEY) {
    // get list of all channel uploads
    logger.info(`YtScrape: Getting videos for ${creatorSlug}`);
    const response = await yt.playlistItems.list({
      playlistId: creator.youtube_upload_id,
      auth: process.env.YOUTUBE_API_KEY,
      part: ["snippet", "contentDetails", "status", "id"],
      maxResults: 20,
      pageToken: "",
    });
    console.log(response.data);
    console.log(videoScrapeLimit);
    if (response.data.items) {
      // response?.data.items.forEach((item) => {
      //   console.log(item?.snippet?.title);
      //   console.log(item?.snippet);

      // });
      console.log(JSON.stringify(response.data.items[0]));
    }
  }
};

export default videosFromYoutube;
