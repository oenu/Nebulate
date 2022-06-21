// Scrapes api for a creator and returns an array of video objects

// Imports
import axios from "axios";
import path from "path";
import fs from "fs";

export const videosFromNebula = async (
  creatorSlug: string,
  videoScrapeLimit?: number
) => {
  let urlBuffer = "";
  let videoBuffer = [];

  // Default scrape limit if none is provided
  if (!videoScrapeLimit) {
    videoScrapeLimit = 100;
  }

  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    try {
      const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
      const requestUrl = urlBuffer ? urlBuffer : url;

      const response = await axios.get(requestUrl, {
        data: {
          Authorization: `Bearer ${global.token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error("Error fetching videos");
      }

      videoBuffer.push(response.data.episodes.results);
      scrapedVideos += response.data.episodes.results.length;
      urlBuffer = response.data.episodes.next;

      if (response.data.episodes.next === null) {
        console.log("Reached end of Next-Redirects");
        break;
      }
    } catch (error) {
      throw error;
    }
  }
  console.log("Video array length %s", videoBuffer.length);
  return videoBuffer;
};

export default videosFromNebula;
