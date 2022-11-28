import { CSS_IDS } from "../../enums";
import { Video } from "../../types";

// eslint-disable-next-line no-undef
let videoStyleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page
// eslint-disable-next-line no-undef
let channelStyleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page

export const addActiveStyle = async (
  currentVideo: Video | undefined,
  options: {
    videoHighlight: boolean; // Highlight current video
    channelHighlight: boolean; // Highlight the channel of the current video
    matchedColor: string; // The color to use for matched videos
  } = {
    videoHighlight: true,
    channelHighlight: true,
    matchedColor: "#3EBBF3",
  }
): Promise<void> => {
  console.debug("Adding active style, currentVideo:", currentVideo);
  // Create the style elements if they don't exist
  if (!videoStyleElement) {
    // eslint-disable-next-line no-undef
    videoStyleElement = document.createElement("style");
    videoStyleElement.id = CSS_IDS.VIDEO;
    // eslint-disable-next-line no-undef
    document.head.appendChild(videoStyleElement);
  }
  if (!channelStyleElement) {
    // eslint-disable-next-line no-undef
    channelStyleElement = document.createElement("style");
    channelStyleElement.id = CSS_IDS.CHANNEL;
    // eslint-disable-next-line no-undef
    document.head.appendChild(channelStyleElement);
  }

  let videoStyle = "";
  let channelStyle = "";

  if (options?.channelHighlight && currentVideo?.channelSlug) {
    channelStyle = `
    div#owner {
      transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
      box-shadow: -10px 0 20px rgb(62, 187, 243), 10px 0 20px rgb(88, 80, 209);
    }
  }`;
  }

  // Create the style for the current video
  if (options?.videoHighlight && currentVideo?.videoSlug) {
    videoStyle = `
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
  }`;
  }

  // Add the style to the style element
  videoStyleElement.innerHTML = videoStyle;
  channelStyleElement.innerHTML = channelStyle;
};

export const removeActiveStyle = async (): Promise<void> => {
  return new Promise<void>((resolve) => {
    console.debug("Removing active style");
    if (videoStyleElement) {
      videoStyleElement.innerHTML = "";
    }
    if (channelStyleElement) {
      channelStyleElement.innerHTML = "";
    }
    resolve();
  });
};
