import {
  videoId,
  CheckVideoMessage,
  CheckVideoMessageResponse,
} from "../../content_script";
import { Messages } from "../../enums";
import { Video } from "../../types";
import { styleUpdater } from "./css";
import { scrapeVideosFromPage } from "./scrape";

// Local Video Cache:
export let pageVideos: {
  // A cache of video links/thumbnails on the page and their corresponding nebula video
  [key: string]: Video;
};

export let pageIntervalId: number; // The id of the interval that checks for new videos on the page
/**
 * HandleNewVideos: Match videos, update pageVideos, trigger style updates
 * 1. Pass the video ids to the background script
 * 2. Handle the response
 * 2.1 Update the pageVideos object
 * 3. Use styleUpdater to update the styling for all videos in the pageVideos object
 */
export const handleNewVideos = async (newVideos: videoId[]): Promise<void> => {
  // 1.
  // Pass the video ids to the background script
  const message: CheckVideoMessage = {
    type: Messages.CHECK_VIDEO,
    url: newVideos,
  };
  chrome.runtime.sendMessage(message, (response) => {
    // 2.
    // Handle the response
    if (response) {
      const { videos, type } = response as CheckVideoMessageResponse;

      if (type !== Messages.CHECK_VIDEO_RESPONSE)
        throw new Error("CS: handleNewVideos: invalid response type");
      if (videos) {
        // 2.1
        // Update the pageVideos object
        console.debug("CS: handleNewVideos: updating pageVideos");
        videos.forEach((video) => {
          pageVideos[video.videoId] = video;
        });

        // 3.
        // Use styleUpdater to update the styling for all videos in the pageVideos object
        styleUpdater(Object.values(pageVideos));
      } else {
        console.warn("CS: handleNewVideos: no videos found");
      }
    }
  });
};

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
