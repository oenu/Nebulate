import {
  addChannelButton,
  removeChannelButton,
} from "./contentFunctions/buttons/channel";
import {
  addChannelCSS,
  removeChannelCSS,
} from "./contentFunctions/styling/channel";
import { urlChanged } from "./contentFunctions/page/update";
import {
  addVideoButton,
  removeVideoButton,
} from "./contentFunctions/buttons/video";
import { addVideoCSS, removeVideoCSS } from "./contentFunctions/styling/video";
import { Messages } from "./enums";
import { Channel, Video } from "./types";

console.debug("CS: init");
// // Runs in the context of the youtube tab

// Local Variables:
export let localChannel: Channel | undefined; // The nebula channel that matches the current url
export let localVideo: Video | undefined; // The nebula video that matches the current url

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

export type CheckVideoMessage = {
  // Sent from the content script to the background script to check if a video or array of videos exist on nebula
  type: Messages.CHECK_VIDEO;
  url: string[];
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
 * 1. Handle a clear message
 *  1.1 Remove the channel button and styling
 *  1.2 Remove the video button and styling
 * 2. Handle an add channel button message
 *  2.1 Add the channel button
 *  2.2 Add the channel styling
 * 3. Handle a remove channel button message
 *  3.1 Remove the channel button
 *  3.2 Remove the channel styling
 * 4. Handle an add video button message
 *  4.1 Add the video button
 *  4.2 Add the video styling
 * 5. Handle a remove video button message
 *  5.1 Remove the video button
 *  5.2 Remove the video styling
 * 6. Pass to url update handler
 
 */
chrome.runtime.onMessage.addListener((message) => {
  try {
    console.debug("CS: message received", message);
    switch (message.type) {
      // 1.
      // Handle a clear message
      case Messages.CLEAR:
        console.debug("CS: clear");

        // 1.1
        // Remove the channel button and styling
        removeChannelButton();
        removeChannelCSS();

        // 1.2
        // Remove the video button and styling
        removeVideoButton();
        removeVideoCSS();
        break;

      // 2.
      // Handle an add channel button message
      case Messages.ADD_CHANNEL_BUTTON:
        {
          console.debug("CS: add channel button");
          const { channel } = message;
          if (!channel) {
            console.error("CS: Add_Channel_Button: no channel provided");
            return;
          }
          localChannel = channel;

          // 2.1
          // Add the channel button
          addChannelButton();

          // 2.2
          // Add the channel styling
          addChannelCSS();
        }
        break;

      // 3.
      // Handle a remove channel button message
      case Messages.REMOVE_CHANNEL_BUTTON: {
        console.debug("CS: remove channel button");

        // 3.1
        // Remove the channel button
        removeChannelButton();

        // 3.2
        // Remove the channel styling
        removeChannelCSS();
        localChannel = undefined;
        break;
      }

      // 4.
      // Handle an add video button message
      case Messages.ADD_VIDEO_BUTTON: {
        console.debug("CS: add video button");
        const { video } = message;
        if (!video) {
          console.error("CS: Add_Video_Button: no video provided");
          return;
        }
        localVideo = video;

        // 4.1
        // Add the video button
        addVideoButton();

        // 4.2
        // Add the video styling
        addVideoCSS();
        break;
      }

      // 5.
      // Handle a remove video button message
      case Messages.REMOVE_VIDEO_BUTTON: {
        console.debug("CS: remove video button");

        // 5.1
        // Remove the video button
        removeVideoButton();

        // 5.2
        // Remove the video styling
        removeVideoCSS();
        localVideo = undefined;
        break;
      }

      // 6.
      // Handle a url change message
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
