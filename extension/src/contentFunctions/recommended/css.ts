import { CSS_IDS } from "../../enums";
import { Video } from "../../types";

// eslint-disable-next-line no-undef
export let styleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page

export const createStyle = async (
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
    // Known
    highlightKnown: true,
    knownColor: "#FFD700", // Gold

    // Matched
    highlightMatched: true,
    // matchedColor: " #3EBBF3", // Gold
    matchedColor: "#3EBBF3",

    // Matched Icon
    showMatchedIcon: true,
    matchedIcon: "https://via.placeholder.com/50",
    matchedIconSize: 20,
    matchedIconPosition: "tl",
    matchedIconColor: "#3EBBF3",
  }
): Promise<void> => {
  // Create the style element if it doesn't exist
  if (!styleElement) {
    // eslint-disable-next-line no-undef
    styleElement = document.createElement("style");
    styleElement.id = CSS_IDS.BULK_VIDEO;
    // eslint-disable-next-line no-undef
    document.head.appendChild(styleElement);
  }

  const newStyle: string[] = [];

  // Create the style for known videos
  if (options.highlightKnown) {
    const knownVideos = videos.filter((video) => video.matched && video.known);
    const knownStyle = knownVideos
      .map((video) => {
        // Don't match the video if it is a playlist
        return `
        /* Known video: ${video.videoSlug} */
        /* Search for the video title */
        a[href*="${video.videoId}"]:not([href*="start_radio"]) #channel-name yt-formatted-string 
        /* Set the color */
        { color: ${options.knownColor} !important; }`;
      })
      .join("\n");
    newStyle.push(knownStyle);
  }

  // Create the style for matched videos
  if (options.highlightMatched) {
    const matchedVideos = videos.filter((video) => video.matched);
    const matchedStyle = matchedVideos.map((video) => {
      // Channel Name

      const channelName = `
      /* Matched Channel: ${video.channelSlug} */
      /* Search for matched channel name */
        a[href*="${video.videoId}"]:not([href*="start_radio"]) #channel-name yt-formatted-string 
        /* Set matched video's channel name to the matched color */
        { color: ${options.matchedColor} !important }`;

      // Video Title
      const videoTitle = `
      /* Search for matched video title */
        a[href*="${video.videoId}"]:not([href*="start_radio"]) #video-title
        /* Set matched video's title to the matched color */
        { color: ${options.matchedColor} !important }`;

      // Thumbnail
      const thumbnail = `
      /* Search for matched thumbnail */
        a[href*="${video.videoId}"]:not([href*="start_radio"]).ytd-thumbnail
        /* Set matched video's border to the matched color */
        { border: 2px solid ${options.matchedColor} !important }`;

      return [channelName, videoTitle, thumbnail].join("\n");
    });

    newStyle.push(matchedStyle.join("\n"));
  }

  // Create the style for matched icons
  // if (options.showMatchedIcon) {
  //   const matchedVideos = videos.filter((video) => video.matched);
  //   const matchedStyle = matchedVideos
  //     .map((video) => {
  //       // const iconPosition = options.matchedIconPosition;
  //       const iconSize = options.matchedIconSize;
  //       const iconColor = options.matchedIconColor;
  //       const icon = options.matchedIcon;
  //       return `
  //         #thumbnail[href*="${video.videoId}"]+yt-image+img {
  //           position: absolute;
  //         }
  //         #thumbnail[href*="${video.videoId}"]+yt-image+img {
  //           content: url(${icon});
  //           width: ${iconSize}%;
  //           height: ${iconSize}%;
  //           filter: invert(${iconColor});
  //         }
  //       }`;
  //     })
  //     .join("\n");

  //   newStyle.push(matchedStyle);
  // }

  // Reset the style element
  console.log("newStyle", newStyle);
  styleElement.innerHTML = newStyle.join("\n");
};
