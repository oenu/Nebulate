import { checkTable } from "../../../common/checkTable";
import { createStyledSvg } from "../../../common/createStyledSvg";
import { CSS_IDS, Messages } from "../../../common/enums";
import { getOptions } from "../../../common/options";
import { LookupTable } from "../../../common/parent_types";
import { constructWatchPageOptions, pageTypes } from "./pageOptions";

// A generic function that can be used to watch a page for new videos (based on watchHomePage)
export const watchPage = async (
  pageType: typeof pageTypes[keyof typeof pageTypes]
  // eslint-disable-next-line no-undef
): Promise<MutationObserver> => {
  const options = await getOptions();

  // Construct the options (uses a function to insert color variables into the styles)
  const watchPageOptions = await constructWatchPageOptions(pageType);

  // Check if the page matches the urlRegex
  // eslint-disable-next-line no-undef
  if (!watchPageOptions.urlRegex.test(window.location.href)) {
    throw new Error("Not on correct page");
  }

  // Remove any existing styles
  // eslint-disable-next-line no-undef
  document.getElementById(CSS_IDS.MASS_VIDEO)?.remove();

  // Add the styles to the page
  // eslint-disable-next-line no-undef
  const styleElement = document.createElement("style");
  styleElement.id = CSS_IDS.MASS_VIDEO;
  styleElement.innerHTML = watchPageOptions.styles.join("\n");

  // eslint-disable-next-line no-undef
  document.head.appendChild(styleElement);

  // Get the lookup table for fast lookup of videoIds
  const localLookupTable = (await chrome.storage.local.get("lookupTable")) as {
    lookupTable: LookupTable;
  };

  // Create a mutation observer to watch for new videos
  // eslint-disable-next-line no-undef
  const mutationObserver = new MutationObserver(async (mutations) => {
    // Detect if the window is being resized
    const isWindowResize = mutations.some((mutation) => {
      return (
        mutation.type === "attributes" &&
        mutation.attributeName === "style" &&
        // eslint-disable-next-line no-undef
        mutation.target === document.body
      );
    });

    // If the window is being resized, don't do anything
    if (isWindowResize) {
      console.log("Window resize detected");
      return;
    }

    // Check if page still matches the urlRegex
    // eslint-disable-next-line no-undef
    if (!watchPageOptions.urlRegex.test(window.location.href)) {
      console.log(`watchPage: No longer on ${pageType} page`);
      mutationObserver.disconnect();
      return;
    }

    if (mutations.some((mutation) => mutation.type === "childList")) {
      // Detect if hover event (div#mouseover-overlay.style-scope.ytd-thumbnail) as target of mutation
      const isHoverEvent = mutations.some((mutation) => {
        // eslint-disable-next-line no-undef
        return (
          // eslint-disable-next-line no-undef
          mutation.target instanceof HTMLElement &&
          mutation.target.id === "mouseover-overlay" &&
          mutation.target.classList.contains("style-scope") &&
          mutation.target.classList.contains("ytd-thumbnail")
        );
      });

      // If the mutation is a hover event, don't do anything
      if (isHoverEvent) {
        console.debug("Hover event detected, not doing anything...");
        return;
      }

      // console.time("watchPage: Mutation");
      // Get the video elements that already have been scraped
      const existingMatches =
        // eslint-disable-next-line no-undef
        document.querySelectorAll("[nebulate-video-id]");

      // Check if the elements with styling have changed
      const existingMatchPromises = Array.from(existingMatches).map(
        async (match) => {
          return new Promise<boolean>((resolve, reject) => {
            // eslint-disable-next-line no-undef
            const videoId = match.getAttribute("nebulate-video-id");
            const href = watchPageOptions.selectors
              // eslint-disable-next-line no-undef
              .hrefFromRootElement(match as HTMLElement)
              ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
            if (!videoId || !href) {
              reject("Video ID or Href ID not found");
              return;
            }
            if (href && href !== videoId) {
              // Remove all attributes and classes that were added by Nebulate
              match.removeAttribute("nebulate-video-id");
              match.classList.remove("nebulate-scraped");
              match.classList.remove("nebulate-matched");
              match.removeAttribute("nebulate-video-slug");
              match.querySelector("nebulate-thumbnail-button")?.remove();
              resolve(true);
            } else {
              resolve(false);
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
              `watchPage: Removed ${removedVideos.length} videos from the page`
            );
          }
        });
      }

      // Remove buttons from videos that have been removed from the page
      // eslint-disable-next-line no-undef
      document
        .querySelectorAll(".nebulate-not-matched .nebulate-thumbnail-button")
        .forEach((button) => {
          console.log("Removing erroneous button");
          button.remove();
        });

      // Get the videos that haven't been scraped yet
      const newVideoElements = watchPageOptions.selectors.newVideoElements();

      // Check if there are any new videos
      if (newVideoElements.length > 0) {
        // Get the videoIDs from the videos
        const videoIds = Array.from(newVideoElements)
          .map((video) => {
            // eslint-disable-next-line no-undef
            const id = watchPageOptions.selectors
              // eslint-disable-next-line no-undef
              .hrefFromRootElement(video as HTMLElement)
              ?.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0];
            if (id) return id;
          })
          .filter((href) => href !== undefined) as string[];

        if (videoIds.length === 0) {
          console.debug("watchPage: No video IDs found");
          return;
        }

        // Remove duplicates without using set
        const uniqueVideoIds = videoIds.filter(
          (videoId, index) => videoIds.indexOf(videoId) === index
        );

        // const uniqueVideoIds = [...new Set(videoIds)];

        console.debug("watchPage: Found videos: ", uniqueVideoIds);
        if (!uniqueVideoIds) {
          console.debug("watchPage: No unique videos found");
          return;
        }

        // Filter out undefined values
        const filteredVideoIds = uniqueVideoIds.filter(
          (videoId): videoId is string => videoId !== undefined
        );

        if (filteredVideoIds.length === 0) {
          console.debug("watchPage: No videos passed filter");
          return;
        }

        // Add the nebulate-scraped attribute to the videos so they don't get checked again
        // eslint-disable-next-line no-undef
        newVideoElements.forEach((video) => {
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
                    reject("watchPage: Video not found in database");
                    return;
                  }
                  // Style the videos (assigns the nebulate-matched attribute which is used by the css selector)
                  // eslint-disable-next-line no-undef
                  const videoElement =
                    watchPageOptions.selectors.videoElementFromId(videoId);
                  if (videoElement) {
                    // To allow us to check if the videoId has been changed, set the videoId as an attribute
                    videoElement.setAttribute(
                      "nebulate-video-id",
                      video.videoId
                    );

                    // If the video is matched, add the nebulate-matched attribute
                    if (video.matched) {
                      videoElement.classList.add("nebulate-matched");
                    } else {
                      videoElement.classList.add("nebulate-not-matched");
                    }
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
                          watchPageOptions.selectors.thumbnailFromRootElement(
                            videoElement
                          );

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
                          svg_button.classList.add("nebulate-thumbnail-button");

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
                                `watchPage: Thumbnail Redirect: No element with slug found in path, event: `
                              );
                              console.error(event);
                              reject("No element with slug found in path");
                            }
                          };

                          // Overlay the button on the thumbnail

                          svg_button.style.position = "absolute";
                          svg_button.style.top = "0";
                          svg_button.style.left = "0";
                          svg_button.style.fill = "white";

                          // Background

                          button_root_element.appendChild(svg_button);
                        }
                      }
                    }
                  } else {
                    console.error(
                      `watchPage: Thumbnail Redirect: No video element found for videoId: `,
                      videoId
                    );
                    reject("No video element found for videoId");
                  }
                }
              })
              .catch((error) => {
                console.error(error);
                reject(error);
              })
              .finally(() => {
                resolve();
              });
          });
        });

        // Wait for all the videos to be formatted
        console.time("watchPage: Formatted videos");
        Promise.allSettled(videoFormatPromises).then(() => {
          console.timeEnd("watchPage: Formatted videos");
          console.debug("watchPage: All videos formatted");
        });
      }
      // console.timeEnd("watchPage: Mutation");
    }
  });

  // Start watching for mutations
  console.log("watchPage: Watching home page...");
  // eslint-disable-next-line no-undef
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return mutationObserver;
};
