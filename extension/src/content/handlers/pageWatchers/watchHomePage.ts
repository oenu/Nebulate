import { checkTable } from "../../../common/checkTable";
import { createStyledSvg } from "../../../common/createStyledSvg";
import { CSS_IDS, Messages } from "../../../common/enums";
import { getOptions } from "../../../common/options";
import { LookupTable } from "../../../common/parent_types";

// Style Home Page Videos

// Returns an observer that can be disconnected when the page is closed
// eslint-disable-next-line no-undef
export const watchHomePage = async (): Promise<MutationObserver> => {
  const options = await getOptions();

  if (!options.homeShow.value) {
    throw new Error("Options are set to not show on home page");
  }

  if (!options.bulkColor.value) {
    console.warn("watchHomePage: Bulk color not set, using default");
    options.bulkColor.value = "#3ebff3";
  }

  // Check if the page is the home page
  // eslint-disable-next-line no-undef
  if (window.location.href === "https://www.youtube.com/") {
    const homePageStyle = `
    /* Thumbnail Border Color */
    /* .nebulate-matched #thumbnail {
      box-shadow: 0 0 20px 15px  ${options.bulkColor.value} !important;
    } */
    .nebulate-matched#content {
      box-shadow: 0 0 20px 15px  ${options.bulkColor.value} !important;
    }
    
    /* Video Title Color */
    .nebulate-matched #video-title {
      color: ${options.bulkColor.value} !important;
    }`;

    // eslint-disable-next-line no-undef
    document.getElementById(CSS_IDS.MASS_VIDEO)?.remove();

    // eslint-disable-next-line no-undef
    const styleElement = document.createElement("style");
    styleElement.id = CSS_IDS.MASS_VIDEO;
    styleElement.innerHTML = homePageStyle;

    // eslint-disable-next-line no-undef
    document.head.appendChild(styleElement);
    console.log("watchHomePage: Watching home page");

    // Get the lookup table for fast lookup
    const localLookupTable = (await chrome.storage.local.get(
      "lookupTable"
    )) as { lookupTable: LookupTable };

    // Mutation observer to watch for new videos, doesn't actually get the videos, just triggers a css selector to get the videos
    // eslint-disable-next-line no-undef
    const observer = new MutationObserver(async (mutations) => {
      // Check if the page is still the home page
      // eslint-disable-next-line no-undef
      if (window.location.href !== "https://www.youtube.com/") {
        console.debug("Home page closed, disconnecting observer");
        observer.disconnect();
        return;
      }

      // Check if the mutation is a childList mutation
      if (mutations.some((mutation) => mutation.type === "childList")) {
        const existingMatches =
          // eslint-disable-next-line no-undef
          document.querySelectorAll("[nebulate-video-id]");

        // Check every video that has been checked to see if it's href is equal to its [nebulate-video-id] attribute

        const existingMatchPromises = Array.from(existingMatches).map(
          async (match) => {
            return new Promise<boolean>((resolve, reject) => {
              // eslint-disable-next-line no-undef
              const videoId = match.getAttribute("nebulate-video-id");
              // eslint-disable-next-line no-undef
              const videoHrefId = match
                .querySelector(
                  "a#thumbnail"
                  // eslint-disable-next-line no-undef
                )
                ?.getAttribute("href")
                ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];

              if (!videoId || !videoHrefId) {
                reject("Video ID or Href ID not found");
                return;
              }

              // Extract the video id from the href .match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0]

              if (videoHrefId && videoHrefId !== videoId) {
                // console.debug(
                // "watchHomePage: Removing video attributes as href has changed",
                // match
                // );

                // Remove all attributes and classes that were added by Nebulate
                match.removeAttribute("nebulate-video-id");
                match.classList.remove("nebulate-scraped");
                match.classList.remove("nebulate-matched");
                match.removeAttribute("nebulate-video-slug");
                match.querySelector("nebulate-thumbnail-button")?.remove();
                resolve(true); // Return true to indicate that the video was removed
              } else {
                resolve(false); // Return false to indicate that the video was not removed
              }
            });
          }
        );

        if (existingMatchPromises.length > 0) {
          await Promise.allSettled(existingMatchPromises).then((results) => {
            // Debugging, check how many videos were removed
            const resolvedPromises = results.filter(
              (result) => result.status === "fulfilled"
              // eslint-disable-next-line no-undef
            ) as PromiseFulfilledResult<boolean>[];
            const removedVideos = resolvedPromises.filter(
              (result) => result.value === true
            );
            if (removedVideos.length > 0) {
              console.debug(
                `watchHomePage: Removed ${removedVideos.length} videos from home page`
              );
            }
          });
        }

        // Get all the videos that haven't been checked yet
        // eslint-disable-next-line no-undef
        const newVideos = document.querySelectorAll(
          "ytd-rich-grid-renderer div#content:has(a#thumbnail[href]):not(.nebulate-scraped)"
        );
        if (newVideos.length > 0) {
          // Get the videoIDs from the videos
          const videoIds = Array.from(newVideos)
            .map((video) => {
              // eslint-disable-next-line no-undef
              const href = video
                .querySelector(
                  "ytd-rich-grid-renderer div#content:has(a#thumbnail[href]):not(.nebulate-scraped) a#thumbnail[href]"
                )
                ?.getAttribute("href")
                ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
              if (href) return href;
            })
            .filter((href) => href !== undefined) as string[];

          if (videoIds.length === 0) {
            console.debug("No video IDs found");
            return;
          }

          // Remove duplicates
          const uniqueVideoIds = [...new Set(videoIds)];
          console.debug("Found videos: ", uniqueVideoIds);
          if (!uniqueVideoIds) {
            console.debug("No unique videos found");
            return;
          }

          // Filter out undefined values
          const filteredVideoIds = uniqueVideoIds.filter(
            (videoId): videoId is string => videoId !== undefined
          );

          if (filteredVideoIds.length === 0) {
            console.debug("No videos passed filter");
            return;
          }

          // Add the nebulate-scraped attribute to the videos so they don't get checked again
          // eslint-disable-next-line no-undef
          newVideos.forEach((video) => {
            video.classList.add("nebulate-scraped");
          });

          // Use promises to format videos
          const videoFormatPromises = filteredVideoIds.map((videoId) => {
            return new Promise<void>((resolve, reject) => {
              // Check if the video is in the database
              checkTable({
                urls: [videoId],
                inputTable: localLookupTable.lookupTable,
                checkKnown: false,
              })
                .then((checkedVideos) => {
                  if (checkedVideos.length === 0) {
                    // console.debug("Video not found in database");
                    resolve();
                    return;
                  } else {
                    // console.debug("Video found in database");
                    const video = checkedVideos[0];
                    if (!video) {
                      reject("Video not found in database");
                      return;
                    }
                    // Style the videos (assigns the nebulate-matched attribute which is used by the css selector)
                    // eslint-disable-next-line no-undef
                    const videoElement = document.querySelector(
                      `ytd-rich-grid-renderer div#content:has(a#thumbnail[href*='v=${video.videoId}'])`
                      // eslint-disable-next-line no-undef
                    ) as HTMLElement;
                    if (videoElement) {
                      // To allow us to check if the videoId has been changed, set the videoId as an attribute
                      videoElement.setAttribute(
                        "nebulate-video-id",
                        video.videoId
                      );

                      // If the video is matched, add the nebulate-matched attribute
                      if (video.matched)
                        videoElement.classList.add("nebulate-matched");
                      if (video.matched)
                        videoElement.setAttribute(
                          "nebulate-video-id",
                          video.videoId
                        );
                      if (video.matched && video.slug)
                        videoElement.setAttribute(
                          "nebulate-video-slug",
                          video?.slug
                        );

                      // If the video is matched add a button to the thumbnail to open the video on Nebula
                      if (video.matched) {
                        if (video.slug) {
                          const button_root_element =
                            videoElement.querySelector("#avatar-link");

                          const existing_button =
                            button_root_element?.querySelector(
                              "nebulate-thumbnail-button"
                            );
                          if (button_root_element && !existing_button) {
                            // eslint-disable-next-line no-undef
                            const svg_button = createStyledSvg(
                              options.buttonColor.value as string
                              // eslint-disable-next-line no-undef
                            );
                            svg_button.classList.add(
                              "nebulate-thumbnail-button"
                            );

                            // button.innerHTML = "Open In Nebula";
                            svg_button.onclick = (event): void => {
                              console.log(event);

                              event.stopPropagation();
                              event.preventDefault();

                              // Get the slug from the actual video element
                              const elementPath = event.composedPath();
                              const elementWithSlug = elementPath.find(
                                (element) => {
                                  // eslint-disable-next-line no-undef
                                  if (element instanceof HTMLElement) {
                                    return element.getAttribute(
                                      "nebulate-video-slug"
                                    );
                                  }
                                }
                                // eslint-disable-next-line no-undef
                              ) as HTMLElement;

                              // If the element with the slug is found, open the video
                              if (elementWithSlug) {
                                console.log(
                                  `Found element with slug: `,
                                  elementWithSlug
                                );
                                const slugValue = elementWithSlug.getAttribute(
                                  "nebulate-video-slug"
                                );
                                if (slugValue) {
                                  console.log(`Opening slug: `, slugValue);

                                  chrome.runtime.sendMessage({
                                    type: Messages.VIDEO_REDIRECT,
                                    video: slugValue,
                                  });
                                }
                              } else {
                                console.error(
                                  "watchHomePage: Thumbnail Redirect: No element with slug found in path, event: "
                                );
                                console.error(event);
                                reject("No element with slug found in path");
                              }
                            };

                            button_root_element.appendChild(svg_button);
                          }
                        }
                      }
                    } else {
                      console.error(
                        "watchHomePage: Thumbnail Redirect: No video element found"
                      );
                      reject("No video element found");
                    }
                  }
                })
                .finally(() => {
                  resolve();
                });
            });
          });

          // Wait for all the videos to be formatted

          console.time("watchHomePage: Thumbnail Redirect: Formatting videos");
          Promise.allSettled(videoFormatPromises).then(() => {
            console.debug("All videos formatted");
            console.timeEnd(
              "watchHomePage: Thumbnail Redirect: Formatting videos"
            );
          });
        }
      }
    });

    // Start watching for mutations
    console.log("watchHomePage: Watching home page...");
    // eslint-disable-next-line no-undef
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  } else {
    throw new Error("watchHomePage: Not on home page");
  }
};

export default watchHomePage;
