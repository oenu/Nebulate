import { CSS_IDS } from "../../enums";
import { Video } from "../../types";

// eslint-disable-next-line no-undef
export let styleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page
/**
 * styleUpdater: Create a style element and add it to the page with selectors for every video in the pageVideos object
 * 1. Create a style element if it doesn't exist
 * 1.1 Check the DOM for a style element, if it already exists, use that
 * 2. Create a selector for each videoId in the pageVideos object (use *= matching) (remove duplicates)
 * 2.1 If the video is matched (from a channel on nebula, and has a matching video on nebula) add to the matched selector
 * 2.2 If the video is known (is from a channel that is on nebula) add to the known selector
 * 2.3 If the video is unknown (is not from a channel that is on nebula) do nothing
 * 3. Add the selectors to the style element
 * 3.1 Matched Videos
 * Note: known selector (if option for known highlighting is enabled) also includes matched videos
 * 3.1.1 Add matched video styling - glow and add a nebulate icon in the top left corner
 * 3.2 Known Videos
 * 3.2.1 Combine Known video selectors
 * 3.2.1 Add known video styling - glow effect around the video card/div
 * Note: Known videos should have a glow effect, matched videos should have a glow effect
 * 4. Add the style element to the page
 * Note: we cant use ids because they are not unique (thanks google)
 * Note: videoId's are in the form of /watch?v=${videoId} or /watch?v=${videoId}&otherStuff or others
 */
export const styleUpdater = async (
  videos: Video[],
  options: {
    // Known
    highlightKnown?: boolean; // Whether to highlight known videos
    knownColor?: string; // The color to use for known videos

    // Matched
    highlightMatched?: boolean; // Whether to highlight matched videos
    matchedColor?: string; // The color to use for matched videos

    // Matched Icon
    showMatchedIcon?: boolean; // Whether to show the nebulate icon on matched videos
    matchedIcon?: string; // The icon to use for matched videos
    matchedIconSize?: number; // The size of the icon to use for matched videos (in percentage height of the video thumbnail)
    matchedIconPosition?: "tl" | "tr" | "bl" | "br"; // The position of the icon to use for matched videos
    matchedIconColor?: string; // The hex color of the icon to use for matched videos
  } = {
    highlightKnown: true,
    knownColor: "#AFE1AF", // Celadon
    highlightMatched: true,
    matchedColor: " #FFD700", // Gold
    matchedIcon: "https://via.placeholder.com/50",
    matchedIconSize: 20,
    matchedIconPosition: "tl",
    matchedIconColor: "#000000",
  }
): Promise<void> => {
  console.time("CS: styleUpdater");

  // 1.
  // Create a style element if it doesn't exist
  if (!styleElement) {
    // 1.1
    // Check the DOM for a style element, if it already exists, use that
    // eslint-disable-next-line no-undef
    styleElement = document.querySelector(
      `#${CSS_IDS.BULK_VIDEO}`
      // eslint-disable-next-line no-undef
    ) as HTMLStyleElement;
    if (!styleElement) {
      // eslint-disable-next-line no-undef
      styleElement = document.createElement("style");
      styleElement.id = CSS_IDS.BULK_VIDEO;
      // eslint-disable-next-line no-undef
      document.head.append(styleElement);
    }
  }

  // 2.
  // Create a selector for each videoId in the pageVideos object (use *= matching) (remove duplicates)
  const knownSelectors: string[] = [];
  const matchedSelectors: string[] = [];
  const knownVideoIds = new Set<string>();
  const matchedVideoIds = new Set<string>();
  videos.forEach((video) => {
    // 2.1
    // If the video is matched (from a channel on nebula, and has a matching video on nebula) add to the matched selector
    if (video.matched) {
      matchedVideoIds.add(video.videoId);
      matchedSelectors.push(`[href*="/watch?v=${video.videoId}"]`);
    }

    // 2.2
    // If the video is known (is from a channel that is on nebula) add to the known selector
    if (video.known) {
      knownVideoIds.add(video.videoId);
      knownSelectors.push(`[href*="/watch?v=${video.videoId}"]`);
    }

    // 2.3
    // If the video is unknown (is not from a channel that is on nebula) do nothing
    // Note: Unknown videos will not have a selector
  });

  // 3.
  // Add the selectors to the style element
  const styleText: string[] = [];

  // 3.1
  // Matched Videos
  if (options.highlightMatched && matchedSelectors.length > 0) {
    // Note: known selector (if option for known highlighting is enabled) also includes matched videos
    // 3.1.1
    // Add matched video styling - glow and add a nebulate icon in the top left corner
    styleText.push(`
      ${matchedSelectors.join(",")} {
        ${
          options.showMatchedIcon
            ? `background-image: url(${options.matchedIcon});`
            : ""
        }
        ${
          options.showMatchedIcon
            ? `background-position: ${options.matchedIconPosition};`
            : ""
        }
        ${options.showMatchedIcon ? `background-repeat: no-repeat;` : ""}
        ${
          options.showMatchedIcon
            ? `background-size: ${options.matchedIconSize}%;`
            : ""
        }
        ${
          options.showMatchedIcon
            ? `background-color: ${options.matchedIconColor};`
            : ""
        }
        box-shadow: 0 0 5px ${options.matchedColor};
      }
    `);
  }

  // 3.2
  // Known Videos
  if (options.highlightKnown && knownSelectors.length > 0) {
    // 3.2.1
    // Add known video styling - glow effect around the video card/div
    styleText.push(`
      ${knownSelectors.join(",")} {
        box-shadow: 0 0 5px ${options.knownColor};
      }
    `);
  }

  // 4.
  // Add the style element to the page
  styleElement.innerHTML = styleText.join("");

  // Note: we cant use ids because they are not unique (thanks google)
  // Note: videoId's are in the form of /watch?v=${videoId} or /watch?v=${videoId}&otherStuff or others
  console.timeEnd("CS: styleUpdater");
  return;
};
