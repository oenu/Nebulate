console.log("CS: init");
// Runs in the context of the youtube tab

// const videoCss = require("./css/video.css");
import { CSS, Messages } from "./enums";

import {
  // addCreatorButton,
  addNebulaControls,
  loadCSS,
  removeNebulaControls,
  unloadCSS,
  // removeCreatorButton,
} from "./functions/domMethods";

let creator_slug: string;

chrome.runtime.onMessage.addListener((message) => {
  const { type } = message;
  console.log(message.videoId);
  switch (type) {
    case "NEW_VIDEO":
      console.log(
        "CS: New video loaded, known: %s, matched: %s",
        message.known,
        message.matched
      );
      const { videoId, matched, known } = message;
      creator_slug = message.creator_slug;
      newVideoLoaded(videoId, known, matched, creator_slug);
      break;

    case "NO_SLUG_FROM_REDIRECT":
      console.log("CS: No slug from redirect request");
      handleNoSlugRedirect();
      break;

    default:
      console.log("CS: Unknown message type");
      break;
  }
});

// Types
interface Video {
  url: string;
  channel_slug: string;
  matched: boolean;
}

// (() => {

let current_video_id: string | null = null;

const handleNoSlugRedirect = async () => {
  console.log("CS: No slug redirect");
};

export const redirectHandler = async (message: Messages) => {
  // Request redirect address for current video
  console.log("Requesting redirect address for current video");

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
  console.log("CS: Requesting redirect to: " + url);
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

  const nebulate_styling_exists = document.getElementById("nebulate-extension");
  if (known) {
    // addCreatorButton();
    loadCSS(CSS.CREATOR);
    if (!nebulate_styling_exists) loadCSS(CSS.NEBULA_VIDEO);
    if (matched) addNebulaControls();
    else removeNebulaControls();
  } else {
    unloadCSS(CSS.NEBULA_VIDEO);
    unloadCSS(CSS.CREATOR);
    removeNebulaControls();
    // removeCreatorButton();
  }
};

// IDEA: #1 Highlight the video with a blue border if it has a match
// IDEA: #4 Whenever on a nebula creators video, highlight the creator / indicate that they are a nebula creator
