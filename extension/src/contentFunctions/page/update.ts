import { checkTable } from "../checkTable";
import { videoId } from "../../content_script";
import { Video } from "../../types";
import {
  identifyPage,
  YoutubePage,
  // YoutubePageType
} from "./identify";

// Centralized function to update the style elements
import { createStyle } from "../styling/bulk";

// Scrapes the page for the video data
import { scrapeVideosFromPage } from "./scrape";

// A single display option
import { OptionId, optionUtilityType } from "../../options";

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
 * The url changing
 * This should find all the links on the page that are known or matched videos and highlight them using css
 * 1. Identify the page and get page options
 * 2. If the type has changed, clear the interval that checks for new videos
 * 3. If the video id has changed, clear the interval and the cache
 * 4. Get options from chrome storage and override the options provided from identifyPage if necessary (eg. if options say to not to add the video button to the page)
 * 5. If any highlights are required
 * 5.1. Scrape the page for videos (also gets channel info for highlight)
 * 5.2. Add the required highlight css to the page
 * 5.3. Start the interval that checks for new videos
 * 6. Return
 */
export const urlChanged = async (url: string): Promise<void> => {
  console.debug("urlChanged: url update handler", url);

  // 1.
  // Identify the page and get page options
  const newPage = await identifyPage();
  if (localPage.type === "unknown") {
    console.error("urlChanged: Page wasn't able to be identified, " + url);
    return;
  }

  // 2.
  // If the type has changed, clear the interval that checks for new videos
  if (localPage.type !== newPage.type) {
    console.debug("urlChanged: Page type changed, clearing interval");
    pageIntervalId ?? clearInterval(pageIntervalId);
  }

  // 3.
  // If the video id has changed, clear the interval and the cache
  if (localPage.video?.videoId !== newPage.video?.videoId) {
    console.debug("urlChanged: Video id changed, clearing interval and cache");
    pageIntervalId ?? clearInterval(pageIntervalId);
    pageVideos = {};
  }

  // 4.
  // Get options from chrome storage and override the options provided from identifyPage if necessary (eg. if options say to not to add the video button to the page)
  const options = chrome.storage.local.get(
    Object.values(OptionId),
    (items: { [key: string]: optionUtilityType }) => {
      if (items[OptionId.HIGHLIGHT_CHANNEL] === false) {
        newPage.options.channelHighlight = false;
      }
      if (items[OptionId.HIGHLIGHT_VIDEO] === false) {
        newPage.options.videoHighlight = false;
      }
      if (items[OptionId.ADD_VIDEO_BUTTON] === false) {
        newPage.options.videoRedirect = false;
      }
      if (items[OptionId.ADD_CHANNEL_BUTTON] === false) {
        newPage.options.channelRedirect = false;
      }
      if (items[OptionId.GLOW_COLOR] !== undefined) {
        newPage.options = items[OptionId.GLOW_COLOR];
      }
    }
  );
};

// 5.
// If any highlights are required

// 5.
// If any highlights are required

//   // 1.
//   // Clear the pageVideos cache
//   pageVideos = {};

//   // 1.1
//   // Stop the interval that checks for new videos
//   if (pageIntervalId) {
//     clearInterval(pageIntervalId);
//   }

//   // 2.
//   // Check for new videos using scrapeVideosFromPage after 2 seconds
//   const newVideos = await new Promise<videoId[]>((resolve) => {
//     setTimeout(async () => {
//       resolve(await scrapeVideosFromPage(localPage.type));
//     }, 2000);
//   });

//   // 3.
//   // Pass the new videos to handleNewVideos
//   console.debug("urlChanged: Passing new videos to HandleNewVideos");
//   await handleNewVideos(newVideos);

//   // HACK: for now max 2 times (for development purposes)
//   let count = 0;

//   // 4.
//   // Check for new videos every 10 seconds (to handle infinite scroll)
//   // eslint-disable-next-line no-undef
//   pageIntervalId = window.setInterval(async () => {
//     console.debug("urlChanged: Checking for new videos");
//     const newVideos = await scrapeVideosFromPage(localPage.type);
//     if (newVideos.length > 0) {
//       console.debug("urlChanged: New videos found");
//       await handleNewVideos(newVideos);
//     }
//     count++;
//     if (count > 5) {
//       console.error("urlChanged: Dev: Stopping interval");
//       clearInterval(pageIntervalId);
//     }
//   }, 10000);
// };
// };
/**
 * Handle new videos
 * 1. Get videos from scrapeVideosFromPage
 * 1.1. If there are no new videos, return
 * 1.2. If all the videos are already in the cache, return
 * 2. Check the videos against the lookup table
 * 3. Update the pageVideos cache
 */
export const handleNewVideos = async (): Promise<void> => {
  console.debug("handleNewVideos: Handling new videos");

  // 1.
  // Get videos from scrapeVideosFromPage
  const newVideos = await scrapeVideosFromPage(localPage.type);

  // 1.1
  // If there are no new videos, return
  if (newVideos.length <= 0) {
    console.debug("handleNewVideos: No new videos found");
    return;
  }

  // 1.2
  // If all the videos are already in the cache, return
  if (newVideos.every((video) => video in pageVideos)) {
    console.debug("handleNewVideos: All videos are already in the cache");
    return;
  }

  console.debug(`handleNewVideos: ${newVideos.length} new videos to check`);

  // 2.
  // Check the videos against the lookup table
  const checkedVideos = await checkTable(newVideos);

  // 3.
  // Update the pageVideos
  for (const video of checkedVideos) {
    pageVideos[video.videoId] = {
      video,
      checked: true,
    };
  }

  return;
};
