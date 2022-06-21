// Scrapes api for a creator and returns an array of video objects

// Imports
import axios from "axios";
import path from "path";
import fs from "fs";

// Types

// Models

export const videosFromNebula = async (creatorSlug: string) => {
  let urlBuffer = "";
  const videoScrapeLimit = 300;

  const token: string = await fs.promises.readFile(
    path.join(__dirname, "..", "store", "json_token.txt"),
    "utf8"
  );

  let videoBuffer = [];

  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    try {
      const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
      const requestUrl = urlBuffer ? urlBuffer : url;
      const response = await axios.get(requestUrl, {
        data: {
          Authorization: `Bearer ${token}`,
        },
      });
      videoBuffer.push(response.data.episodes.results);
      scrapedVideos += response.data.episodes.results.length;
      urlBuffer = response.data.episodes.next;
      if (response.data.episodes.next === null) {
        console.log("Reached end of Next-Redirects");
        return videoBuffer;
      }
    } catch (error) {
      throw error;
    }
  }
};
