console.debug("CS: init");
// Runs in the context of the youtube tab

// const videoCss = require("./css/video.css");
import { CSS, Messages } from "./enums";

import {
  // addChannelButton,
  addNebulaControls,
  loadCSS,
  removeNebulaControls,
  unloadCSS,
  // removeChannelButton,
} from "./functions/domMethods";

let channelSlug: string;

chrome.runtime.onMessage.addListener((message) => {
  const { type } = message;
  console.debug(message.videoId);
  switch (type) {
    case Messages.NEW_VIDEO:
      console.debug(
        "CS: New video loaded, known: %s, matched: %s",
        message.known,
        message.matched
      );
      const { videoId, matched, known } = message;
      channelSlug = message.channelSlug;
      newVideoLoaded(videoId, known, matched, channelSlug);
      break;

    case Messages.NO_SLUG_REDIRECT:
      console.debug("CS: No slug from redirect request");
      handleNoSlugRedirect();
      break;

    case Messages.CLEAR:
      console.debug("CS: Clearing all styling");
      unloadCSS(CSS.NEBULA_VIDEO);
      unloadCSS(CSS.CREATOR);
      removeNebulaControls();
      // removeChannelButton();
      break;
    default:
      console.debug("CS: Unknown message type");
      break;
  }
});

// Types
interface Video {
  url: string;
  channelSlug: string;
  matched: boolean;
}

// (() => {

let current_video_id: string | null = null;

const handleNoSlugRedirect = async () => {
  console.debug("CS: No slug redirect");
};

export const redirectHandler = async (message: Messages) => {
  // Request redirect address for current video
  console.debug("Requesting redirect address for current video");

  switch (message) {
    case Messages.NEBULA_REDIRECT:
      chrome.runtime.sendMessage({
        type: Messages.NEBULA_REDIRECT,
        url: current_video_id,
      });
      break;

    case Messages.CREATOR_REDIRECT:
      chrome.runtime.sendMessage({
        type: Messages.CREATOR_REDIRECT,
        url: current_video_id,
      });
      break;
  }
};

// Send message to background script to open new tab
const nebulaRedirect = async (url: string) => {
  console.debug("CS: Requesting redirect to: " + url);
};

const newVideoLoaded = async (
  videoId: string,
  known: boolean,
  matched?: boolean,
  slug?: string
) => {
  current_video_id = videoId;

  // Remove nebula styling to enable animation
  unloadCSS(CSS.NEBULA_VIDEO);
  unloadCSS(CSS.CREATOR);

  const video_styling_exists =
    document.getElementsByClassName("nebulate-extension")[0];

  if (known) {
    // addChannelButton();
    // Highlight channel
    loadCSS(CSS.CREATOR);
    if (matched) {
      // Highlight video
      addNebulaControls();
      if (!video_styling_exists) loadCSS(CSS.NEBULA_VIDEO);
    } else removeNebulaControls();
  } else {
    // Unknown video, remove nebula controls and styling
    unloadCSS(CSS.NEBULA_VIDEO);
    unloadCSS(CSS.CREATOR);
    removeNebulaControls();
    // removeChannelButton();
  }
};

// IDEA: #1 Highlight the video with a blue border if it has a match
// IDEA: #4 Whenever on a nebula channels video, highlight the channel / indicate that they are a nebula channel
