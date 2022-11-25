import {
  videoId,
  CheckVideoMessage,
  CheckVideoMessageResponse,
} from "../../content_script";
import { Messages } from "../../enums";
import { Video } from "../../types";
import { createStyle } from "./css";

import { scrapeVideosFromPage } from "./scrape";

// Local Video Cache:
export let pageVideos: {
  // A cache of video links/thumbnails on the page and their corresponding nebula video
  [key: string]: {
    video: Video;
    checked: boolean;
  };
};

// BUG: Videos shown in the miniplayer are not detected, maybe switch all url matching to use the scrape/videoId function instead of the url

export let pageIntervalId: number; // The id of the interval that checks for new videos on the page
/**
 * Handle a new url being loaded
 * This should find all the links on the page that are known or matched videos and highlight them using css
 * 1. Clear the pageVideos cache
 * 2. Check for new videos using newVideosFromPage after 2 seconds (to allow the page to load)
 * 3. Pass the new videos to handleNewVideos
 * 4. Check for new videos every 10 seconds (to handle infinite scroll)
 */
export const urlUpdateHandler = async (url: string): Promise<void> => {
  console.debug("urlUpdateHandler: url update handler", url);

  // 1.
  // Clear the pageVideos cache
  pageVideos = {};

  // 2.
  // Check for new videos using newVideosFromPage after 2 seconds
  const newVideos = await new Promise<videoId[]>((resolve) => {
    setTimeout(() => {
      resolve(scrapeVideosFromPage());
    }, 2000);
  });

  // 3.
  // Pass the new videos to handleNewVideos
  console.debug("urlUpdateHandler: Passing new videos to HandleNewVideos");
  await handleNewVideos(newVideos);

  // 4.
  // Check for new videos every 10 seconds (to handle infinite scroll)
  if (pageIntervalId) {
    clearInterval(pageIntervalId);
  }

  // HACK: for now max 2 times (for development purposes)
  let count = 0;
  // eslint-disable-next-line no-undef
  pageIntervalId = window.setInterval(async () => {
    console.debug("urlUpdateHandler: Checking for new videos");
    const newVideos = await scrapeVideosFromPage();
    if (newVideos.length > 0) {
      console.debug("urlUpdateHandler: New videos found");
      await handleNewVideos(newVideos);
    }
    count++;
    if (count > 2) {
      console.debug("urlUpdateHandler: Stopping interval");
      clearInterval(pageIntervalId);
    }
  }, 10000);
};

/**
 * HandleNewVideos: Match videos, update pageVideos, trigger style updates
 * 1. Check if a list has been provided
 * 2. Send a message to the background script to check if the videos are known or matched
 * 2.1 Handle the response
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
  // Send a message to the background script to check if the videos are known or matched
  console.debug("handleNewVideos: Sending message to background script");
  const message: CheckVideoMessage = {
    type: Messages.CHECK_VIDEO,
    url: newVideos,
  };

  chrome.runtime.sendMessage(message, async (response) => {
    // 2.1
    // Handle the response
    if (response) {
      const { videos, type } = response as CheckVideoMessageResponse;

      if (type !== Messages.CHECK_VIDEO_RESPONSE)
        throw new Error("CS: handleNewVideos: invalid response type");
      if (videos) {
        // 3.
        // Update the pageVideos cache
        // Update the pageVideos object
        console.debug("CS: handleNewVideos: updating pageVideos");

        videos.forEach((video) => {
          pageVideos[video.videoId] = { video, checked: true };
        });

        // 4.
        // Use createStyle to update the styling for all videos in the pageVideos object
        createStyle(Object.values(pageVideos).map((v) => v.video));
      } else {
        console.warn("CS: handleNewVideos: no videos found");
      }
    }
  });
};
