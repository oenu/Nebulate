import { checkTable } from "../../../common/checkTable";
import { createStyledSvg } from "../../../common/createStyledSvg";
import { CSS_IDS, Messages } from "../../../common/enums";
import { getOptions } from "../../../common/options";

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
      box-shadow: -10px 0 40px ${options.bulkColor.value} !important;
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

        // Check each existing match to see if it's href is equal to its [nebulate-video-id] attribute
        existingMatches.forEach((match) => {
          // eslint-disable-next-line no-undef
          const videoId = match.getAttribute("nebulate-video-id");
          // eslint-disable-next-line no-undef
          const videoHref = match.querySelector(
            "a#thumbnail"
            // eslint-disable-next-line no-undef
          ) as HTMLAnchorElement;

          // Extract the video id from the href .match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0]
          const videoIdFromHref = videoHref.href.match(
            /(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/
          )?.[0];

          if (videoHref && videoIdFromHref !== videoId) {
            console.debug(
              "watchHomePage: Removing match with incorrect href",
              match
            );

            // Remove match styling and attributes
            // eslint-disable-next-line no-undef
            match.removeAttribute("nebulate-video-id");
            // eslint-disable-next-line no-undef
            match.classList.remove("nebulate-matched");

            // Remove the svg from the match
            // eslint-disable-next-line no-undef
            const svg = match.querySelector("svg");
            if (svg) {
              svg.remove();
            }
          }
        });

        // Get all the videos that haven't been checked yet
        // eslint-disable-next-line no-undef
        const newVideos = document.querySelectorAll(
          "ytd-rich-grid-renderer div#content:has(a#thumbnail[href]):not(.nebulate-scraped)"
        );
        if (newVideos.length > 0) {
          /** Issue: When the page is resized, elements can have their video changed which causes an unknown video to have the styling, class and button
           * Solution: Add an id to the video that contains the youtube video id, if the id is different to the href of the video, remove the styling and class
           * - Pro: Fast
           * - Con: More complex
           *
           *
           */

          // Get the videoIDs from the videos
          const videoIds = Array.from(newVideos)
            .map((video) => {
              // eslint-disable-next-line no-undef
              const href = video
                .querySelector(
                  "ytd-rich-grid-renderer div#content:has(a#thumbnail[href]):not(.nebulate-scraped) a#thumbnail[href]"
                )
                ?.getAttribute("href")
                ?.split("v=")[1]
                ?.split("&")[0];
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

          // Check the videos against the database
          const checkedVideos = await checkTable(filteredVideoIds);

          // Style the videos (assigns the nebulate-matched attribute which is used by the css selector)
          console.debug("Checked videos: ", checkedVideos.length, "adding css");

          // eslint-disable-next-line no-undef
          checkedVideos.forEach((video) => {
            // eslint-disable-next-line no-undef
            const videoElement = document.querySelector(
              `ytd-rich-grid-renderer div#content:has(a#thumbnail[href*='v=${video.videoId}'])`
              // eslint-disable-next-line no-undef
            ) as HTMLElement;
            if (videoElement) {
              // If the video is matched, add the nebulate-matched attribute
              if (video.matched) videoElement.classList.add("nebulate-matched");
              if (video.matched)
                videoElement.setAttribute("nebulate-video-id", video.videoId);
              if (video.matched && video.slug)
                videoElement.setAttribute("nebulate-video-slug", video?.slug);

              // If the video is matched add a button to the menu
              if (video.matched) {
                if (video.slug) {
                  const button_root_element =
                    videoElement.querySelector("#avatar-link");
                  if (button_root_element) {
                    // eslint-disable-next-line no-undef
                    const svg_button = createStyledSvg(
                      options.buttonColor.value as string
                      // eslint-disable-next-line no-undef
                    );
                    svg_button.classList.add("nebulate-thumbnail-button");

                    // button.innerHTML = "Open In Nebula";
                    svg_button.onclick = (event): void => {
                      console.log(event);

                      event.stopPropagation();
                      event.preventDefault();

                      // Get the slug from the actual video element
                      const elementPath = event.composedPath();
                      const elementWithSlug = elementPath.find((element) => {
                        // eslint-disable-next-line no-undef
                        if (element instanceof HTMLElement) {
                          return element.getAttribute("nebulate-video-slug");
                        }
                        // eslint-disable-next-line no-undef
                      }) as HTMLElement;

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
                      }
                    };

                    button_root_element.appendChild(svg_button);
                  }
                }
              }
            }
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
