import { checkTable } from "../checkTable";
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
import { BUTTON_IDS } from "../../enums";
import { addVideoButton } from "../buttons/video";
import { addChannelButton } from "../buttons/channel";

// Local Video Cache:
export let pageVideos: {
  [key: string]: {
    // videoId
    video: Video; // Video object
    checked: boolean; // Whether the video has been checked
  };
} = {};

let localPage: YoutubePage;

// BUG: Videos shown in the miniplayer are not detected, maybe switch all url matching to use the scrape/videoId function instead of the url

export let pageIntervalId: number; // The id of the interval that checks for new videos on the

export const urlChanged = async (url: string): Promise<void> => {
  console.debug("urlChanged: url update handler", url);
  console.log(pageVideos);

  // 1.
  // Identify the page and get page options
  const newPage = await identifyPage();

  if (!newPage) {
    console.debug("urlChanged: No page identified");
    return;
  } else {
    console.debug("urlChanged: Page identified", newPage);
    localPage = newPage;
  }

  if (localPage?.type === "unknown") {
    console.debug("urlChanged: Page wasn't able to be identified, " + url);
    return;
  }

  // 2.
  // If the type has changed, clear the interval that checks for new videos
  if (localPage?.type !== newPage.type) {
    console.debug("urlChanged: Page type changed, clearing interval");
    pageIntervalId ?? clearInterval(pageIntervalId);
  }

  // 3.
  // If the video id has changed, clear the interval and the cache
  if (localPage?.video?.videoId !== newPage.video?.videoId) {
    console.debug("urlChanged: Video id changed, clearing interval and cache");
    pageIntervalId ?? clearInterval(pageIntervalId);
    pageVideos = {};
  }

  // 4.
  // If any highlights are required
  if (
    localPage.options.bulkHighlight ||
    localPage.options.channelHighlight ||
    localPage.options.videoHighlight
  ) {
    await updater();

    // 5.
    // Start the interval that checks for new videos (every 10 seconds) if it isn't already running
    if (!pageIntervalId) {
      // eslint-disable-next-line no-undef
      pageIntervalId = window.setInterval(async () => {
        console.debug("urlChanged: Interval fired");
        await updater();
      }, 10000);
    }
  }

  // 6.
  // Return
  return;
};

// =================================================================================================

const updater = async (): Promise<void> => {
  // 5.1.
  // Scrape the page for videos (also gets channel info for highlight)
  const scrapeResult = await scrapeVideosFromPage(localPage.type);

  if (scrapeResult.videoIds.length === 0) {
    console.debug("updater: No videos found on page");
  }

  let currentVideo: Video | undefined;
  if (scrapeResult.currentVideoId) {
    currentVideo = (await checkTable([scrapeResult.currentVideoId]))[0];
  }

  let newVideos: Video[] = [];
  if (scrapeResult.videoIds.length > 0) {
    newVideos = await checkTable(scrapeResult.videoIds);
    if (newVideos.every((id) => id.videoId in pageVideos)) {
      console.debug("updater: All videos are already in the cache");
      newVideos = [];
    } else {
      for (const video of newVideos) {
        pageVideos[video.videoId] = {
          video,
          checked: true,
        };
      }
    }
  }

  // 5.3
  // If a current video exists, check if it has buttons and add them if not
  if (currentVideo?.matched) {
    // If the video doesn't have buttons, add them
    // eslint-disable-next-line no-undef
    const videoRedirectBtn = document.getElementById(BUTTON_IDS.VIDEO);
    if (!videoRedirectBtn) {
      addVideoButton();
    }
  } else {
    // If no current video exists, remove the buttons
    // eslint-disable-next-line no-undef
    const videoRedirectBtn = document.getElementById(BUTTON_IDS.VIDEO);
    if (videoRedirectBtn) {
      videoRedirectBtn.remove();
    }
  }

  // If channel is known from the video, add the channel button
  if (currentVideo?.known) {
    // If the channel doesn't have buttons, add them
    // eslint-disable-next-line no-undef
    const channelRedirectBtn = document.getElementById(BUTTON_IDS.CHANNEL);
    if (!channelRedirectBtn) {
      addChannelButton();
    }
  } else {
    // If no current video exists or the channel is not known, remove the buttons
    // eslint-disable-next-line no-undef
    const channelRedirectBtn = document.getElementById(BUTTON_IDS.CHANNEL);
    if (channelRedirectBtn) {
      channelRedirectBtn.remove();
    }
  }

  // 5.3.
  // Add the required highlight css to the page
  createStyle(newVideos, currentVideo, localPage.options);
};
