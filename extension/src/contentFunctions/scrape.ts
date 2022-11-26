import { videoId } from "../content_script";
import { YoutubePageType } from "./page/identify";
import { pageVideos } from "./update";

/**
 * ScrapeVideosFromPage
 * 1. Scrape the page based on the page type
 * 2. Filter out any videos that are already in the pageVideos cache
 * 3. Return the results
 */

export const scrapeVideosFromPage = async (
  pageType: YoutubePageType
): Promise<videoId[]> => {
  let newVideos: videoId[] = [];
  // 1.
  // Call the other scrape functions to get the new videos
  switch (pageType) {
    case "video":
      console.debug("scrapeVideosFromPage: Video page");
      newVideos = await scrapeVideoPage();
      break;
    case "subscriptions":
      console.debug("scrapeVideosFromPage: Subscriptions page");
      newVideos = await scrapeSubscriptionPage();
      break;
    case "search":
      console.debug("scrapeVideosFromPage: Search page");
      newVideos = await scrapeSearchPage();
      break;
    case "home":
      console.debug("scrapeVideosFromPage: Home page");
      newVideos = await scrapeHomePage();
      break;
    default:
      console.debug("scrapeVideosFromPage: Unknown page");
      break;
  }

  // 2.
  // Filter out any videos that are already in the pageVideos cache
  newVideos = newVideos.filter((videoId) => !pageVideos[videoId]);

  // 3.
  // Return the results
  return newVideos;
};

/**
 * ScrapeVideoPage
 * This should find all recommended videos on the youtube video player page
 * 1. Get all the video elements from the page
 * 2. Create promises to get the videoId for each video element
 * 3. Filter out any videos that are already in the pageVideos cache
 * 4. Return the results
 */
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

  // 3.
  // Trigger the promises and wait for the results
  const videoIds = (await Promise.allSettled(promises))
    .map((promise) => {
      return promise.status === "fulfilled" ? promise.value : null;
    })
    .filter((videoId) => {
      return videoId !== null;
    }) as videoId[];

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
 * ScrapeSubscriptionPage
 * This should find all videos on the youtube subscription page
 * 1. Get all the video elements from the page
 * 2. Create promises to get the videoId for each video element
 * 3. Filter out any videos that are already in the pageVideos cache
 * 4. Return the results
 */
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

/**
 * ScrapeSearchPage
 * This should find all videos on the youtube search page
 * 1. Get all the video elements from the page
 * 2. Create promises to get the videoId for each video element
 * 3. Filter out any videos that are already in the pageVideos cache
 * 4. Return the results
 */
// :not([page-subtype="subscriptions"]) .ytd-search #video-title:not([class*='radio']):not([class*='playlist'])
export const scrapeSearchPage = async (): Promise<videoId[]> => {
  console.debug("scrapeSearchPage: Getting new videos from search page");
  // 1.
  // Get all the video elements from the page
  const promises = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll(
      `:not([page-subtype="subscriptions"]) .ytd-search #video-title:not([class*='radio']):not([class*='playlist'])`
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

/**
 * ScrapeHomePage
 * This should find all videos on the youtube home page
 * 1. Get all the video elements from the page
 * 2. Create promises to get the videoId for each video element
 * 3. Filter out any videos that are already in the pageVideos cache
 * 4. Return the results
 */

export const scrapeHomePage = async (): Promise<videoId[]> => {
  console.debug("scrapeHomePage: Getting new videos from home page");
  // 1.
  // Get all the video elements from the page
  const promises = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll("#video-title-link:not([class*='radio'])")
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
