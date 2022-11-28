import { videoId } from "../../content_script";
import { YoutubePageType } from "./identify";
import { pageVideos } from "./update";
console.log("scrape.ts");

export const scrapeVideosFromPage = async (
  pageType: YoutubePageType
): Promise<{
  videoIds: string[];
  currentVideoId?: string;
}> => {
  let newVideos: {
    videoIds: string[];
    currentVideoId?: string;
  } = {
    videoIds: [],
    currentVideoId: undefined,
  };

  // 1.
  // Get the current video id if it exists
  try {
    newVideos.currentVideoId = await scrapeCurrentVideo();
  } catch (error) {
    console.error("scrapeVideosFromPage: Error scraping current video", error);
  }

  // 2.
  // Call the other scrape functions to get the new videos
  switch (pageType) {
    case "video":
      console.debug("scrapeVideosFromPage: Video page");
      try {
        newVideos.videoIds = await scrapeVideoPage();
      } catch (error) {
        console.error("scrapeVideosFromPage: Error scraping video page", error);
      }
      break;
    case "subscriptions":
      console.debug("scrapeVideosFromPage: Subscriptions page");
      try {
        newVideos.videoIds = await scrapeSubscriptionPage();
      } catch (error) {
        console.error(
          "scrapeVideosFromPage: Error scraping subscriptions page",
          error
        );
      }

      break;
    case "search":
      console.debug("scrapeVideosFromPage: Search page");
      try {
        newVideos.videoIds = await scrapeSearchPage();
      } catch (error) {
        console.error(
          "scrapeVideosFromPage: Error scraping search page",
          error
        );
      }
      break;

    case "home":
      console.debug("scrapeVideosFromPage: Home page");
      try {
        newVideos.videoIds = await scrapeHomePage();
      } catch (error) {
        console.error("scrapeVideosFromPage: Error scraping home page", error);
      }
      break;
    default:
      console.debug("scrapeVideosFromPage: Unknown page");
      break;
  }

  // 2.
  // Filter out any videos that are already in the pageVideos cache
  newVideos = {
    videoIds: newVideos.videoIds.filter((videoId) => !pageVideos[videoId]),
    currentVideoId: newVideos.currentVideoId,
  };

  // 3.
  // Return the new videos
  return newVideos;
};

/**
 * ScrapeCurrentVideo
 * 1. Get the video id from the page
 * 2. Return the video id
 */
export const scrapeCurrentVideo = async (): Promise<videoId> => {
  return new Promise((resolve, reject) => {
    console.debug("scrapeCurrentVideo: Getting current video id");
    // 1.
    // Get the video id from the page
    // eslint-disable-next-line no-undef
    const id = document
      .querySelector("ytd-watch-flexy[video-id]")
      ?.getAttribute("video-id");

    // 2.
    // Return the video id
    if (id) {
      resolve(id);
    } else {
      reject("scrapeCurrentVideo: No id found");
    }
  });
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
