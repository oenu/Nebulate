import { urlChanged } from "./contentFunctions/page/update";
import { Messages } from "./enums";
import { Channel, Video } from "./types";

console.debug("CS: init");
// // Runs in the context of the youtube tab

export type videoId = string;

export type VideoRedirectMessage = {
  // Sent from the content script to the background script to redirect the user to a video
  type: Messages.VIDEO_REDIRECT;
  video: Video;
};

export type ChannelRedirectMessage = {
  // Sent from the content script to the background script to redirect the user to a channel
  type: Messages.CHANNEL_REDIRECT;
  channel: Channel;
};

export type CheckVideoMessageResponse = {
  // Sent from the background script to the content script in response to a CheckVideoMessage
  type: Messages.CHECK_VIDEO_RESPONSE;
  videos: Video[] | undefined;
};

export type UrlUpdateMessage = {
  // Sent from the background script to the content script when the page url changes
  type: Messages.URL_UPDATE;
  url: string;
};

/**
 * Handle Messages from the background script
 * 1. Handle a change of url
 */
chrome.runtime.onMessage.addListener((message) => {
  try {
    console.debug("CS: message received", message);
    switch (message.type) {
      // 1.
      // Handle a change of url
      case Messages.URL_UPDATE: {
        console.debug("CS: url update");
        const { url } = message;
        if (!url) {
          console.error("CS: Url_Update: no url provided");
          return;
        }
        urlChanged(url);
        break;
      }
    }
  } catch (error) {
    console.error("CS: error", error);
  }
});
