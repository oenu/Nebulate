console.log("CS: init");
// Runs in the context of the youtube tab

// const videoCss = require("./css/video.css");
import { Messages } from "./enums";

import {
  addNebulaControls,
  loadCSS,
  removeNebulaControls,
  unloadCSS,
} from "./functions/domMethods";

chrome.runtime.onMessage.addListener((message) => {
  const { type } = message;
  console.log(message.videoId);
  switch (type) {
    case "NEW_VIDEO":
      console.log("CS: New known video loaded");
      const { videoId, slug, matched, known } = message;
      newVideoLoaded(videoId, known, matched, slug);
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

const insertCSS = async (css: string) => {
  const style = document.createElement("style");
  style.innerHTML = css;
  document.head.appendChild(style);
};

export const redirectHandler = async () => {
  // Request redirect address for current video
  console.log("Requesting redirect address for current video");

  chrome.runtime.sendMessage({
    type: Messages.NEBULA_REDIRECT,
    url: current_video_id,
  });
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
  unloadCSS();

  const nebulate_styling_exists = document.getElementById("nebulate-extension");
  if (known) {
    if (!nebulate_styling_exists) loadCSS("nebula");
    // Add button to redirect to nebula
    if (matched) addNebulaControls();
    // Remove button to redirect to nebula
    else removeNebulaControls();
  } else {
    unloadCSS();
    removeNebulaControls();
  }
};

// IDEA: #1 Highlight the video with a blue border if it has a match
// IDEA: #4 Whenever on a nebula creators video, highlight the creator / indicate that they are a nebula creator
