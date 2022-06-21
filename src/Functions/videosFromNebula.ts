// Scrapes api for a creator and returns an array of video objects

// Imports
import axios from "axios";
import logger from "../config/logger";

/**
 * @param {string} creatorSlug - The creator's slug
 * @returns {Promise<any>} Returns a promise that resolves to an array of video objects
 * @memberof Functions
 * @description Scrapes api for a creator and returns an array of video objects
 */
export const videosFromNebula = async (
  creatorSlug: string,
  onlyScrapeNew: boolean,
  videoScrapeLimit?: number
) => {
  let urlBuffer = "";
  let videoBuffer = [];

  // TODO: Import list of known videos
  const videoCache = [
    {
      slug: "legaleagle-can-kyle-rittenhouse-sue-everyone-that-called-him-a-murderer",
    },
    {
      slug: "legaleagle-hammering-john-oliver-on-hammer-lawyers",
    },
    {
      slug: "legaleagle-putins-war-on-ukraine-and-international-law",
    },
  ];

  // Default scrape limit if none is provided
  if (!videoScrapeLimit) {
    videoScrapeLimit = 20;
  }

  for (let scrapedVideos = 0; scrapedVideos < videoScrapeLimit; ) {
    try {
      const url = `https://content.watchnebula.com/video/channels/${creatorSlug}/`;
      const requestUrl = urlBuffer ? urlBuffer : url;

      // Get the next page of videos
      const response = await axios.get(requestUrl, {
        data: {
          Authorization: `Bearer ${global.token}`,
        },
      });

      const newEpisodes = response.data.episodes.results;
      videoBuffer.push(...newEpisodes);
      scrapedVideos += newEpisodes.length;
      urlBuffer = response.data.episodes.next;

      // If onlyScrapeNew is true, check if the video is in the cache
      if (onlyScrapeNew === true) {
        const newVideos = newEpisodes.filter((video: any) => {
          return !videoCache.some((cacheVideo) => {
            return cacheVideo.slug === video.slug;
          });
        });

        // If no new videos are found, break the loop
        if (newVideos.length === 0) {
          logger.info(`Scrape: No new videos found for ${creatorSlug}`);
          break;
        }

        // If end of new videos is reached, break the loop
        if (newVideos.length > 0 && newVideos.length < newEpisodes.length) {
          logger.info(
            `Scrape: ${newVideos.length} new videos found for: ${creatorSlug}`
          );
          break;
        }
        // If all new videos are found, continue the loop
        if (newVideos.length === newEpisodes.length) {
          logger.info(
            `Scrape: All new videos found: ${creatorSlug}, scraping again`
          );
        }
      }

      // If no next page is found, break the loop
      if (response.data.episodes.next === null) {
        logger.info("Scrape: Reached end of Next-Redirects");
        break;
      }
    } catch (error) {
      logger.error(error);
      logger.error("Scrape: Could not scrape videos");
      throw new Error("Scrape: Could not scrape videos");
    }
  }

  console.log("Fetched: %s videos for: %s ", videoBuffer.length, creatorSlug);
  return videoBuffer;
};

export default videosFromNebula;
