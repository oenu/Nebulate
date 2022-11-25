import { checkTable } from "../../backgroundFunctions/checkTable";
import { videoId } from "../../content_script";
import { Video } from "../../types";
import {
  identifyPage,
  YoutubePage,
  // YoutubePageType
} from "../page/identify";
import { createStyle } from "./css";

import { scrapeVideosFromPage } from "./scrape";

// Local Video Cache:
export let pageVideos: {
  [key: string]: {
    // videoId
    video: Video; // Video object
    checked: boolean; // Whether the video has been checked
  };
};

let localPage: YoutubePage;

// BUG: Videos shown in the miniplayer are not detected, maybe switch all url matching to use the scrape/videoId function instead of the url

export let pageIntervalId: number; // The id of the interval that checks for new videos on the page
/**
 * Handle a new url being loaded
 * This should find all the links on the page that are known or matched videos and highlight them using css
 * 1. Clear the pageVideos cache
 * 1.1 Stop the interval that checks for new videos
 * 2. Check for new videos using scrapeVideosFromPage after 2 seconds (to allow the page to load)
 * 3. Pass the new videos to handleNewVideos
 * 4. Check for new videos every 10 seconds (to handle infinite scroll)
 */
export const urlUpdateHandler = async (url: string): Promise<void> => {
  console.debug("urlUpdateHandler: url update handler", url);

  // Identify the page type
  localPage = await identifyPage();

  // 1.
  // Clear the pageVideos cache
  pageVideos = {};

  // 1.1
  // Stop the interval that checks for new videos
  if (pageIntervalId) {
    clearInterval(pageIntervalId);
  }

  // 2.
  // Check for new videos using scrapeVideosFromPage after 2 seconds
  const newVideos = await new Promise<videoId[]>((resolve) => {
    setTimeout(async () => {
      resolve(await scrapeVideosFromPage(localPage.type));
    }, 2000);
  });

  // 3.
  // Pass the new videos to handleNewVideos
  console.debug("urlUpdateHandler: Passing new videos to HandleNewVideos");
  await handleNewVideos(newVideos);

  // HACK: for now max 2 times (for development purposes)
  let count = 0;

  // 4.
  // Check for new videos every 10 seconds (to handle infinite scroll)
  // eslint-disable-next-line no-undef
  pageIntervalId = window.setInterval(async () => {
    console.debug("urlUpdateHandler: Checking for new videos");
    const newVideos = await scrapeVideosFromPage(localPage.type);
    if (newVideos.length > 0) {
      console.debug("urlUpdateHandler: New videos found");
      await handleNewVideos(newVideos);
    }
    count++;
    if (count > 2) {
      console.error("urlUpdateHandler: Dev: Stopping interval");
      clearInterval(pageIntervalId);
    }
  }, 10000);
};

/**
 * HandleNewVideos: Match videos, update pageVideos, trigger style updates
 * 1. Check if a list has been provided
 * 2. Check the videos against the lookup table
 * 3. Update the pageVideos cache
 * 4. Use createStyle to update the styling for all videos in the pageVideos object
 */
export const handleNewVideos = async (newVideos: videoId[]): Promise<void> => {
  // 1.
  // Check if a list has been provided
  if (newVideos.length === 0) {
    console.debug("handleNewVideos: No new videos found");
    return;
  }

  // 2.
  // Check the videos against the lookup table
  console.time("handleNewVideos: checkTable");
  checkTable(newVideos).then(async (response) => {
    console.debug("handleNewVideos: Response received", response);

    // 3.
    // Update the pageVideos
    for await (const video of response) {
      pageVideos[video.videoId] = {
        video,
        checked: true,
      };
    }

    // 4.
    // Use createStyle to update the styling for all videos in the pageVideos object
    console.debug("handleNewVideos: creating style");
    await createStyle(Object.values(pageVideos).map((video) => video.video));
  });
};
