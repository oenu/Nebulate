// import { urlChanged } from "./content/page/update";
import { Messages } from "./common/enums";
import { Channel, Video } from "./common/types";
console.log("content script loaded");
// Listeners
import "./content/listeners/onNewThumbnails.ts";

// // Runs in the context of the youtube tab

// Disable console.log in production
if (process.env.NODE_ENV === "production") {
  console.debug("%cConsole Disabled in Production", "color: green");
  console.debug(
    "%cTo view the development build please visit the repo: https://github.com/oenu/Nebulate",
    "color: green"
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.debug = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.info = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.warn = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.time = (): void => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.timeEnd = (): void => {};
}
console.debug("CS: init");

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
