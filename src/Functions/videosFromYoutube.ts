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
  const creatorId = await Creator.findOne({ slug: creatorSlug }).select(
    "youtube_id"
  );
  console.log(creatorId);
  if (!creatorId) {
    logger.error(`YtScrape: Creator ${creatorSlug} does not have a youtube_id`);
    throw new Error(
      `YtScrape: Creator ${creatorSlug} does not have a youtube_id`
    );
  }

  if (creatorId.youtube_id && process.env.YOUTUBE_API_KEY) {
    // get list of all channel uploads
    logger.info(`YtScrape: Getting videos for ${creatorSlug}`);

    // Get channel upload playlist
    const res = await yt.channels.list({
      id: [creatorId.youtube_id],
      auth: process.env.YOUTUBE_API_KEY,
      part: ["contentDetails"],
    });
    if (res.data?.items) {
      console.log(
        res.data?.items[0]?.contentDetails?.relatedPlaylists?.uploads
      );
      console.log(videoScrapeLimit);
    }
    // Gets Playlists
    // const res = await yt.playlists.list({
    //   channelId: creatorId.youtube_id,
    //   auth: process.env.YOUTUBE_API_KEY,
    //   part: ["snippet", "contentDetails"],
    // });
    // console.log(res.data.items);
    // console.log(videoScrapeLimit);
  }
};

export default videosFromYoutube;
