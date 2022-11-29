import { checkTable } from "../../../common/checkTable";
import { Video } from "../../../common/types";
import { videoId } from "../../page/update";

// Returns a new pageVideos object with the new videos from the subscription page
export const checkSubsPage = async (pageVideos: Video[]): Promise<Video[]> => {
  console.debug(
    "scrapeSubscriptionPage: Getting new videos from subscription page"
  );

  // HACK: REMOVE ME - DEBUGGING TIME SPEED - PROMISES
  console.time("scrapeSubscriptionPage: Promise.all");
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

  // Create promises to get the videoId for each video element
  const videoIds = (await Promise.allSettled(promises))
    .map((promise) => {
      return promise.status === "fulfilled" ? promise.value : null;
    })
    .filter((videoId) => {
      return videoId !== null;
    }) as videoId[];

  console.timeEnd("scrapeSubscriptionPage: Promise.all");

  // HACK: REMOVE ME - DEBUGGING TIME SPEED - ITERATION
  console.time("scrapeSubscriptionPage: iteration");
  // Get all the video elements from the page
  const videoElements = Array.from(
    // eslint-disable-next-line no-undef
    document.querySelectorAll(
      `[page-subtype="subscriptions"] #video-title:not([class*='radio']):not([class*='playlist'])`
    )
  );

  // Iterate over the video elements to get the videoId for each video element
  const videoIds2: videoId[] = [];
  for (const element of videoElements) {
    const id = element
      .getAttribute("href")
      ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
    id && videoIds2.push(id);
  }

  console.timeEnd("scrapeSubscriptionPage: iteration");

  // HACK: REMOVE ME - DEBUGGING TIME SPEED - COMPARISON
  console.log("scrapeSubscriptionPage: videoIds", videoIds.length);
  console.log("scrapeSubscriptionPage: videoIds2", videoIds2.length);

  // END OF DEVELOPMENT CODE

  // Filter out any videos that are already in the pageVideos cache
  const newVideoIds = videoIds.filter((videoId) => {
    return !pageVideos.find((pageVideo) => {
      return pageVideo.videoId === videoId;
    });
  });

  // Get the video data for the new videos
  const newVideos = await checkTable(newVideoIds);

  // Create a new pageVideos object with the new videos
  const newPageVideos = [...pageVideos, ...newVideos];

  // Return the new pageVideos object
  return newPageVideos;
};
