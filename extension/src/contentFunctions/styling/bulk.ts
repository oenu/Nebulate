import { BUTTON_IDS, CSS_IDS } from "../../enums";
import { Video } from "../../types";

// eslint-disable-next-line no-undef
export let styleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page

export const createStyle = async (
  videos: Video[],
  currentVideo?: Video,
  options: {
    bulkHighlight: boolean; // Highlight all videos on the page
    videoHighlight: boolean; // Highlight current video
    channelHighlight: boolean; // Highlight the channel of the current video
    matchedColor?: string; // The color to use for matched videos

    // Matched Icon
    // showMatchedIcon?: boolean; // Whether to show the nebulate icon on matched videos
    // matchedIcon?: string; // The icon to use for matched videos
    // matchedIconSize?: number; // The size of the icon to use for matched videos (in percentage height of the video thumbnail)
    // matchedIconPosition?: "tl" | "tr" | "bl" | "br"; // The position of the icon to use for matched videos
    // matchedIconColor?: string; // The hex color of the icon to use for matched videos
  } = {
    bulkHighlight: false,
    videoHighlight: false,
    channelHighlight: false,
    matchedColor: "#3EBBF3",

    // Matched Icon
    // showMatchedIcon: true,
    // matchedIcon: "https://via.placeholder.com/50",
    // matchedIconSize: 20,
    // matchedIconPosition: "tl",
    // matchedIconColor: "#3EBBF3",
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
  if (options.bulkHighlight) {
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
      // :not(.ytd-thumbnail)
      const videoTitle = `
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

      return [channelName, videoTitle, thumbnail].join("\n");
    });

    newStyle.push(matchedStyle.join("\n"));
  }

  // Create the style for the current channel
  if (options.channelHighlight && currentVideo?.channelSlug) {
    newStyle.push(`
    div#owner {
      transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
      box-shadow: -10px 0 20px rgb(62, 187, 243), 10px 0 20px rgb(88, 80, 209);
    }

    #${BUTTON_IDS.CHANNEL} {
      max-height: 100%;
      height: 36px;
      max-width: 100%;
      line-height: 36px;
    /* Indicate that the button is clickable */
      cursor: pointer;
    }

  #${BUTTON_IDS.CHANNEL}:hover {
    color: rgb(255, 255, 255);
  }`);
  }

  // Create the style for the current video
  if (options.videoHighlight && currentVideo?.videoSlug) {
    newStyle.push(`
  /* Mini Player */
  .miniplayer #container:has(video) {
    box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
    clip-path: inset(-100% -100% 0 -100%);
  }
  
  /* Theatre Player */
  #player-theater-container #container:has(video) {
    box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
    transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s
    /* clip-path: inset(0px -100vw 0px -100vw); */;
  }
    
  /* Normal Player */
  :not(.ytd-page-manager[theater]) #container:has(video) {
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    transition-delay: 0.5s;
    box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
  }`);
  }
};
