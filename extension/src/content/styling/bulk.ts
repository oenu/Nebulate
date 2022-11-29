import { CSS_IDS } from "../../common/enums";
import { Video } from "../../common/types";

// eslint-disable-next-line no-undef
let styleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page

// Matched Icon
// showMatchedIcon?: boolean; // Whether to show the nebulate icon on matched videos
// matchedIcon?: string; // The icon to use for matched videos
// matchedIconSize?: number; // The size of the icon to use for matched videos (in percentage height of the video thumbnail)
// matchedIconPosition?: "tl" | "tr" | "bl" | "br"; // The position of the icon to use for matched videos
// matchedIconColor?: string; // The hex color of the icon to use for matched videos

export const createStyle = async (
  videos: Video[],
  options: {
    bulkHighlight?: boolean; // Highlight all videos on the page
    matchedColor?: string; // The color to use for matched videos
  } = {
    bulkHighlight: true,
    matchedColor: "#3EBBF3",
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
  // Create the style for matched videos

  // HACK: we are adding all styles at the moment but might want to only add the ones that are needed in the future
  if (options.bulkHighlight) {
    const matchedVideos = videos.filter((video) => video.matched);
    const matchedStyle = matchedVideos.map((video) => {
      // Channel Name -- For video page
      const videoPageChannelName = `
      /* Matched Channel: ${video.channelSlug} (video page) */
      /* Search for matched channel name */
      a[href*="${video.videoId}"]:not([href*="start_radio"]) #channel-name yt-formatted-string 
      /* Set matched video's channel name to the matched color */
      { color: ${options.matchedColor} !important }`;

      // Video Title -- For video page
      const videoPageVideoTitle = `
      /* Matched Channel: ${video.channelSlug} (video page) */
      /* Search for matched video title */
      a[href*="${video.videoId}"]:not([href*="start_radio"]) #video-title
      /* Set matched video's title to the matched color */
      { color: ${options.matchedColor} !important }`;

      // Channel Name -- For subscription page
      const subscriptionPageChannelName = `
      /* Matched Channel: ${video.channelSlug} (subscription page)*/
      /* Search for matched channel name */
      div#details:has(a[href*="${video.videoId}"]) ytd-channel-name#channel-name a
      /* Set matched video's channel name to the matched color */
      { color: ${options.matchedColor} !important }`;

      // Video Title -- For subscription page
      const subscriptionPageVideoTitle = `
      /* Search for matched video title */
        a[href*="${video.videoId}"]#video-title
        /* Set matched video's title to the matched color */
        { color: ${options.matchedColor} !important }`;

      // Thumbnail
      const thumbnail = `
      /* Search for matched thumbnail */
        a[href*="${video.videoId}"]:not([href*="start_radio"]).ytd-thumbnail
        /* Set matched video's border to the matched color */
        { border: 2px solid ${options.matchedColor} !important }`;

      return [
        videoPageChannelName,
        subscriptionPageChannelName,
        subscriptionPageVideoTitle,
        videoPageVideoTitle,
        thumbnail,
      ].join("\n");
    });
    newStyle.push(matchedStyle.join("\n"));
  }
  styleElement.innerHTML = newStyle.join("\n");
};
