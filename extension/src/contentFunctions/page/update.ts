import { checkTable } from "../checkTable";
import { Video } from "../../types";

// Centralized function to update the style elements
import { createStyle } from "../styling/bulk";

// Scrapes the page for the video data
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

export type videoId = string;
export type YoutubePageType =
  | "home"
  | "search"
  | "channel"
  | "channel-home"
  | "channel-videos"
  | "channel-playlists"
  | "channel-about"
  | "channel-community"
  | "channel-channels"
  | "channel-featured"
  | "video"
  | "playlist"
  | "subscriptions"
  | "unknown";

const localPage: {
  pageType: YoutubePageType;
  videoId?: videoId;
  videoSlug?: string;
  channelId?: string;
  channelSlug?: string;
} = {
  pageType: "unknown",
};

export let pageIntervalId: number | undefined; // The id of the interval that checks for new videos on the

export const urlChanged = async (url: string): Promise<void> => {
  console.debug("urlChanged: url update handler", url);
  console.log(pageVideos);

  // 1.
  // Call the updater
  console.time("urlChanged: update");
  await updater(url);

  console.timeEnd("urlChanged: update");

  // 2.
  // Start the interval that checks for new videos (every 10 seconds) if it isn't already running
  if (!pageIntervalId) {
    // eslint-disable-next-line no-undef
    pageIntervalId = window.setInterval(async () => {
      console.debug("urlChanged: Interval fired");
      console.time("urlChanged: update (interval)");
      await updater(url);
      console.timeEnd("urlChanged: update (interval)");
    }, 10000);
  }

  return;
};

// =================================================================================================

const updater = async (url: string): Promise<void> => {
  // 1.
  // Get the current video from the page
  const currentVideo = await GetVideoFromPage();

  // Identify the page type
  const pageType = identifyPage(url);
  if (localPage.pageType !== pageType) {
    console.debug(
      "urlChanged: Page type changed, clearing local cache",
      localPage.pageType,
      pageType
    );
    localPage.pageType = pageType;
    pageVideos = {};
  }

  if (currentVideo?.videoId !== localPage.videoId) {
    // Page has changed time to update the page

    console.log("updater: video has changed, updating page");
    if (currentVideo) {
      localPage.videoId = currentVideo.videoId;
      localPage.videoSlug = currentVideo.videoSlug;
      localPage.channelId = currentVideo.channelId;
      localPage.channelSlug = currentVideo.channelSlug;
    }

    // 2.
    // If video or channel need buttons, add them if they don't exist
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
  } else {
    console.debug("urlChanged: Video hasn't changed");
  }

  // 3.
  // If is subscription page, get the videos from the page
  switch (pageType) {
    case "subscriptions":
      {
        // Get the videos from the page
        const videos = await scrapeSubscriptionPage();

        // Filter out any videoId's that exist in the pageVideos object and have been checked
        const filteredVideos = videos.filter(
          (videoId) => !pageVideos[videoId]?.checked
        );

        // If there are no videos, return
        if (filteredVideos.length === 0) {
          console.debug("updater: No new videos found on page");
          return;
        }

        // If there are videos, check them
        const checkedVideos = await checkTable(filteredVideos);

        // If there are no matched videos, return
        if (!checkedVideos) {
          console.debug("updater: No subscription page videos found");
          return;
        }

        // Check if any of the videos are new
        const newVideos = checkedVideos.filter(
          (video) => !pageVideos[video.videoId]
        );

        // If there are new videos, add them to the pageVideos object
        if (newVideos.length > 0) {
          // If there are matched videos, add them to the cache
          for (const video of checkedVideos) {
            pageVideos[video.videoId] = {
              video: video,
              checked: true,
            };
          }

          // If there are videos, update the style with all the videos
          createStyle(Object.values(pageVideos).map((v) => v.video));
        }
      }
      break;

    case "video": {
      // 4.
      // If is video page, get the recommended videos from the page
      if (url.includes("/watch")) {
        // Get the videos from the page
        const videos = await scrapeVideoPage();

        // If there are no videos, return
        if (!videos) {
          console.debug("updater: No videos found on page");
          return;
        }

        // Filter out any videoId's that exist in the pageVideos object and have been checked
        const filteredVideos = videos.filter(
          (videoId) => !pageVideos[videoId]?.checked
        );

        // If there are no videos, return
        if (filteredVideos.length === 0) {
          console.debug("updater: No new videos found on page");
          return;
        }

        // If there are videos, check them
        const checkedVideos = await checkTable(filteredVideos);

        // If there are no matched videos, return
        if (!checkedVideos) {
          console.debug("updater: No video page videos found");
          return;
        }

        // Check if any of the videos are new
        const newVideos = checkedVideos.filter(
          (video) => !pageVideos[video.videoId]
        );

        // If there are new videos, add them to the pageVideos object
        if (newVideos.length > 0) {
          // If there are matched videos, add them to the cache
          for (const video of checkedVideos) {
            pageVideos[video.videoId] = {
              video: video,
              checked: true,
            };
          }

          // If there are videos, update the style with all the videos
          createStyle(Object.values(pageVideos).map((v) => v.video));
        }
      }
      break;
    }

    default:
      console.debug("updater: No page type found");
      break;
  }
  console.log(
    `urlChanged: update complete, ${
      Object.keys(pageVideos).length
    } videos in cache, ${
      (Object.values(pageVideos).filter((v) => v.checked).length /
        Object.keys(pageVideos).length) *
      100
    }% Checked, ${
      Object.keys(pageVideos).filter(
        (videoId) => pageVideos[videoId].video.matched
      ).length
    } videos matched to Nebula`
  );
};

// =================================================================================================
export const GetVideoFromPage = async (): Promise<Video | undefined> => {
  let videoId: string | undefined = undefined;

  // Get the video ID from the page - checking the url is a fallback
  // eslint-disable-next-line no-undef
  videoId = document.querySelector(".miniplayer #container:has(video)")
    ? (videoId =
        // eslint-disable-next-line no-undef
        document.querySelector("[video-id]")?.getAttribute("video-id") ??
        undefined)
    : // eslint-disable-next-line no-undef
      document
        .querySelector("ytd-watch-flexy[video-id]")
        ?.getAttribute("video-id") ??
      // eslint-disable-next-line no-undef
      window.location.href.match(/v=([a-zA-Z0-9_-]+)/)?.[0] ??
      undefined;

  videoId = videoId?.replace("v=", "");

  videoId
    ? console.debug("VideoId found:", videoId)
    : console.debug("videoId not found");

  // if ( document.querySelector(".miniplayer #container:has(video)") ) { videoId = document.querySelector("[video-id]")?.getAttribute("video-id") ?? undefined; } else { videoId = document .querySelector("ytd-watch-flexy[video-id]") ?.getAttribute("video-id") ?? window.location.href.match(/v=([a-zA-Z0-9_-]+)/)?.[0]  ?? undefined; }
  // If the video ID is found, check if it's in the database or return undefined
  return videoId ? (await checkTable([videoId]))?.[0] ?? undefined : undefined;
};

// =================================================================================================

export const scrapeSubscriptionPage = async (): Promise<videoId[]> => {
  console.debug(
    "scrapeSubscriptionPage: Getting new videos from subscription page"
  );
  // 1.
  // Get all the video elements from the page
  const promises = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll(
      `[page-subtype="subscriptions"] #video-title:not([class*='radio']):not([class*='playlist'])`
    )
  ).map((element) => {
    return new Promise<videoId>((resolve, reject) => {
      const id = element
        .getAttribute("href")
        ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
      id ? resolve(id) : reject("No id found");
    });
  });

  // 2.
  // Create promises to get the videoId for each video element
  const videoIds = (await Promise.allSettled(promises))
    .map((promise) => {
      return promise.status === "fulfilled" ? promise.value : null;
    })
    .filter((videoId) => {
      return videoId !== null;
    }) as videoId[];

  // 3.
  // Filter out any videos that are already in the pageVideos cache
  const newVideoIds = videoIds.filter((videoId) => {
    return !pageVideos[videoId];
  });

  // 4.
  // Return the results
  return newVideoIds;
};

// =================================================================================================

export const scrapeVideoPage = async (): Promise<videoId[]> => {
  console.debug("scrapeVideoPage: Getting new videos from video page");
  // 1.
  // Get all the video ids from the page
  const promises = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll(
      `:not([page-subtype="subscriptions"]) a[href*="/watch?v="]:has(#video-title:not([class*='radio']):not([class*='playlist']))`
    )
  ).map((element) => {
    return new Promise<videoId>((resolve, reject) => {
      const id = element
        .getAttribute("href")
        ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
      id ? resolve(id) : reject("No id found");
    });
  });

  // 2.
  // Trigger the promises and wait for the results
  const allPromises = await Promise.allSettled(promises);

  const videoIds = allPromises.reduce((acc, result) => {
    if (result.status === "fulfilled") {
      acc.push(result.value);
    }
    return acc;
  }, [] as videoId[]);
  // 3
  // Filter out any videos that are already in the pageVideos cache
  const newVideos = videoIds.filter((videoId) => !pageVideos[videoId]);

  // 4.
  // Return the results
  return newVideos;
};

// =================================================================================================

const identifyPage = (url: string): YoutubePageType => {
  if (url.includes("/watch?v=")) {
    return "video";
  } else if (url.includes("/playlist?list=")) {
    return "playlist";
  } else if (
    url.includes("/channel/") ||
    url.includes("/user/") ||
    url.includes("/c/")
  ) {
    return "channel";
  } else if (url.includes("/feed/subscriptions")) {
    return "subscriptions";
  } else if (url.includes("/results?search_query=")) {
    return "search";
  } else if (url === "https://www.youtube.com/") {
    return "home";
  } else {
    return "unknown";
  }
};
