console.debug("CS: init");
// Runs in the context of the youtube tab

import { CSS, MessageParams, Messages, Video } from "./enums";

import {
  addCreatorRedirect,
  addNebulaControls,
  loadCSS,
  removeCreatorRedirect,
  removeNebulaControls,
  unloadCSS,
  // addChannelButton,
  // removeChannelButton,
} from "./functions/domMethods";

// Store the current video
let localVideo: Video;

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  const { type } = message;

  // Check if the message is in one of the message types we expect
  if (Object.values(Messages).includes(type)) {
    console.debug(message.videoId);

    switch (type) {
      case Messages.NEW_VIDEO: // A new video has been loaded into the page
        console.debug(
          "CS: New video loaded, known: %s, matched: %s",
          message.known,
          message.matched
        );

        // Set the type of the message for intellisense
        const payload = message as MessageParams[Messages.NEW_VIDEO];

        // Check if a video was included in the message
        if (!payload.video) {
          console.error("CS: No video object in NEW_VIDEO message");
          clearPage();
          return;
        }

        // Set the local video storage to the new video
        localVideo = message.video;

        // Add the Nebula controls to the page
        newVideoLoaded(payload.video);
        break;

      case Messages.CLEAR: // A video is no longer on the page, clear the page
        clearPage();
        break;

      default:
        console.debug("CS: Unknown message type");
        break;
    }
  }
});

/**
 * Clears the page of all Nebula controls and styling
 * @description Removes the Nebula controls and styling from the page
 * @returns
 * @todo Add a transition to the removal of the controls and styling
 */
export const clearPage = () => {
  console.debug("CS: Clearing all styling");
  unloadCSS(CSS.NEBULA_VIDEO);
  unloadCSS(CSS.CREATOR);
  removeNebulaControls();
};

/**
 *  Handles a request to redirect to the Nebula website
 * @description Messages the background script to redirect to the Nebula website
 *  @param videoId The youtube video id that is being redirected
 * @returns
 */
export const redirectHandler = async (message: Messages) => {
  // Request redirect address for current video
  console.debug("Requesting redirect address for current video");

  // Check if the local video is set
  if (!localVideo) {
    console.error("CS: No local video set");
    return;
  }

  // Send a message to the background script to trigger the redirect
  switch (message) {
    case Messages.VIDEO_REDIRECT: // Redirect to Nebula video
      chrome.runtime.sendMessage({
        type: Messages.VIDEO_REDIRECT,
        videoSlug: localVideo.videoSlug,
      } as MessageParams[Messages.VIDEO_REDIRECT]);
      break;

    case Messages.CREATOR_REDIRECT: // Redirect to nebula creator
      chrome.runtime.sendMessage({
        type: Messages.CREATOR_REDIRECT,
        channelSlug: localVideo.channelSlug,
      } as MessageParams[Messages.CREATOR_REDIRECT]);
  }
};

/**
 * Handles the loading of a new video
 * @description Adds the Nebula controls and styling to the page
 * @param video The video object to use for the new video
 * @returns
 */
const newVideoLoaded = async (video: Video) => {
  // Remove nebula styling to enable animation
  unloadCSS(CSS.NEBULA_VIDEO);
  unloadCSS(CSS.CREATOR);
  removeCreatorRedirect();

  // Check if the the page already has the Nebula controls
  const video_styling_exists =
    document.getElementsByClassName("nebulate-extension")[0];

  // If the video is not known then it is also not matched, remove the styling and controls
  if (!video.known) {
    unloadCSS(CSS.NEBULA_VIDEO);
    unloadCSS(CSS.CREATOR);
    removeCreatorRedirect();
    removeNebulaControls();
    return;
  }

  // If the video is known to be from a nebula creator, add the creator highlight
  loadCSS(CSS.CREATOR);
  addCreatorRedirect();

  if (video.matched) {
    // If the video is matched, add the nebula video highlight and controls
    if (!video_styling_exists) loadCSS(CSS.NEBULA_VIDEO);
    addNebulaControls();
  } else {
    // If the video is not matched, remove the controls
    removeNebulaControls();
  }
};
