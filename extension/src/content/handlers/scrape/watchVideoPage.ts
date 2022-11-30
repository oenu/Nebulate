import { checkTable } from "../../../common/checkTable"; // Checks a list of videoIDs against the database
import { CSS_IDS } from "../../../common/enums";

// Style Subs Page Videos
const options = {
  matchedColor: "rgb(62 187 243)",
};

// Watch the Youtube Video page for videos
// eslint-disable-next-line no-undef
export const watchVideoPage = async (): Promise<MutationObserver> => {
  // Check if the page is a video page
  // eslint-disable-next-line no-undef
  if (window.location.href.includes("youtube.com/watch")) {
    const videoStyle = `
    /* Thumbnail Border Color */
    .nebulate-matched #thumbnail {
      box-shadow: 0 0 0 4px ${options.matchedColor} !important;
    }

    /* Video Title Color */
    .nebulate-matched #video-title {
      color: ${options.matchedColor} !important;
    }`;

    // eslint-disable-next-line no-undef
    document.getElementById(CSS_IDS.MASS_VIDEO)?.remove();

    // eslint-disable-next-line no-undef
    const styleElement = document.createElement("style");
    styleElement.id = CSS_IDS.MASS_VIDEO;
    styleElement.innerHTML = videoStyle;

    // eslint-disable-next-line no-undef
    document.head.appendChild(styleElement);

    // Mutation observer to watch for new videos, doesn't actually get the videos, just triggers a css selector to get the videos
    // eslint-disable-next-line no-undef
    const observer = new MutationObserver(async (mutations) => {
      // Check if the page is still the video page
      // eslint-disable-next-line no-undef
      if (!window.location.href.includes("youtube.com/watch")) {
        console.debug(
          "watchVideoPage: Video page closed, disconnecting observer"
        );
        observer.disconnect();
        return;
      }

      // Check if the mutation is a childList mutation
      if (mutations.some((mutation) => mutation.type === "childList")) {
        // Get all the videos that haven't been checked yet
        // eslint-disable-next-line no-undef
        const videos = document.querySelectorAll(
          "div#contents ytd-compact-video-renderer:has(a[href]):not(.nebulate-scraped)"
        );
        if (videos.length > 0) {
          // Get the videoIDs from the videos
          const videoIds = Array.from(videos)
            .map((video) => {
              // eslint-disable-next-line no-undef
              const href = video
                .querySelector(
                  "div#contents ytd-compact-video-renderer:has(a[href]):not(.nebulate-scraped) a#thumbnail[href]"
                )
                ?.getAttribute("href")
                ?.split("v=")[1]
                ?.split("&")[0];
              if (href) return href;
            })
            .filter((href) => href !== undefined) as string[];

          if (videoIds.length === 0) {
            console.debug("watchVideoPage: No video IDs found");
            return;
          }

          // Remove duplicates
          const uniqueVideoIds = [...new Set(videoIds)];
          console.debug("watchVideoPage: Found videos: ", uniqueVideoIds);
          if (!uniqueVideoIds) {
            console.debug("watchVideoPage: No unique videos found");
            return;
          }

          // Filter out undefined values
          const filteredVideoIds = uniqueVideoIds.filter(
            (videoId): videoId is string => videoId !== undefined
          );

          if (filteredVideoIds.length === 0) {
            console.debug("watchVideoPage: No videos passed filter");
            return;
          }

          // Add the nebulate-scraped attribute to the videos so they don't get checked again
          // eslint-disable-next-line no-undef
          videos.forEach((video) => {
            video.classList.add("nebulate-scraped");
          });

          // Check the videos against the database
          const checkedVideos = await checkTable(filteredVideoIds);

          // Style the videos (assigns the nebulate-matched attribute which is used by the css selector)
          console.debug(
            "watchVideoPage: Checked videos: ",
            checkedVideos.length,
            "adding css"
          );

          // eslint-disable-next-line no-undef
          checkedVideos.forEach((video) => {
            // eslint-disable-next-line no-undef
            const videoElement = document.querySelector(
              `ytd-compact-video-renderer:has(a#thumbnail[href*="${video.videoId}"])`
            );
            if (videoElement) {
              if (video.matched) videoElement.classList.add("nebulate-matched");
            }
          });
        }
      }
    });

    // Start watching for mutations
    console.log("watchVideoPage: Watching video page...");
    // eslint-disable-next-line no-undef
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  } else {
    throw new Error("watchVideoPage: Not on video page");
  }
};
