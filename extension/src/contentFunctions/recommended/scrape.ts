import { videoId } from "../../content_script";
import { pageVideos } from "./handler";

/**
 * ScrapeVideosFromPage
 * This should find all recommended videos on the youtube player page
 * 1. Get all the recommended video elements from the page
 * Note: we have to make sure to remove any playlist or radio elements
 * 2. Create promises to get the videoId for each video element
 * 2.1 Recursively get the videoId from the video element parent elements (until we find the videoId) (max 5 levels)
 * Note: Youtube ID Regex (/(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/ )
 * 3. Trigger the promises and wait for the results
 * 4. Filter out any videos that are already in the pageVideos cache
 * 5. Return the results
 */
export const scrapeVideosFromPage = async (): Promise<videoId[]> => {
  // 1.
  // Get all the recommended video elements from the page
  const videoElements = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll(
      "span#video-title:not([class*='radio']):not([class*='playlist'])"
    )
  );

  // 2.
  // Create promises to get the videoId for each video element
  const promises = videoElements.map(async (videoElement) => {
    return new Promise<videoId>((resolve, reject) => {
      let videoId: videoId | undefined;

      // 2.1
      // Recursively get the videoId from the video element parent elements (until we find the videoId) (max 5 levels)
      let parentElement = videoElement.parentElement;
      let level = 0;
      while (level < 5) {
        if (parentElement?.getAttribute("href")) {
          const match = parentElement
            .getAttribute("href")
            ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
          if (match) {
            videoId = match;
            break;
          }
        }
        parentElement = parentElement?.parentElement ?? null;
        level++;
      }

      if (videoId) {
        resolve(videoId);
      } else {
        reject("No videoId found");
      }
    });
  });

  // 3.
  // Trigger the promises and wait for the results
  const results = await Promise.allSettled(promises);
  const videoIds = results
    .map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return null;
      }
    })
    .filter((videoId) => videoId !== null) as videoId[];

  // 4.
  // Filter out any videos that are already in the pageVideos cache
  const newVideoIds = videoIds.filter((videoId) => {
    return !pageVideos[videoId];
  });

  // 5.
  // Return the results
  return newVideoIds;
};

/**
 * CurrentPage
 * This should find what kind of page we are on, the current videoId etc
 * 1. Check what kind of page we are on (home, search, video, channel, playlist, etc)
 *
 *
 *
 *
 * 1. Work out if we are watching a video or not (eg. subscription page, search page, home page or playlist) [page-subtype] (subscription, search, home, playlist)
 *
 * 2. Get any element that has [video-id] attribute
 * 2.1. Get the videoId from the element
 * 3. Return the videoId
 */
// export const currentPage = async (): Promise<videoId | null> => {
