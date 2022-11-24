import { videoId } from "../../content_script";
import { pageVideos } from "./handler";

/**
 * ScrapeVideosFromPage
 * This should find all recommended videos on the youtube player page
 * 1. Get all the recommended video elements that are not in the pageVideos cache
 * 1.1. Filter out any playlists (called radio) - check if the class contains "radio"
 * 2. Create promises to get the videoId for each video element
 * 2.1 Recursively get the videoId from the video element parent elements (until we find the videoId) (max 5 levels)
 * 3. Filter out any videos that are already in the pageVideos cache
 * 4. Return the new videoIds
 */
export const scrapeVideosFromPage = async (): Promise<videoId[]> => {
  // 1.
  // Get all the recommended video elements that are not in the pageVideos cache
  const newVideos = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll("span#video-title")
  ).filter((video) => {
    // 1.1
    // Filter out any playlists (called radio) - check if the class contains "radio"
    return !video.classList.contains("radio");
  });

  // 2.
  // Create promises to get the videoId for each video element
  const videoIdPromises = newVideos.map((video) => {
    // 2.1
    // Recursively get the href from the video element parent elements (until we find the videoId) (max 5 levels)
    let videoId: string | undefined;
    let parent = video.parentElement;
    let count = 0;
    while (!videoId && parent && count < 5) {
      videoId = parent.getAttribute("href") || undefined;
      parent = parent.parentElement;
      count++;
    }
    return videoId?.match(
      // /(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/ - Youtube videoId regex
      /(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/
    )?.[0];
  });

  // 3.
  // Filter out any videos that are already in the pageVideos cache
  const newVideoIds = (await Promise.all(videoIdPromises))
    .filter((videoId): videoId is videoId => videoId !== undefined)
    .filter((videoId) => {
      return !pageVideos[videoId];
    });

  console.debug(
    `newVideosFromPage: pageVideosLength: ${
      Object.keys(pageVideos).length
    } newVideoIdsLength: ${newVideoIds.length}`
  );

  // 4.
  // Return the new videoIds
  return newVideoIds;
};
