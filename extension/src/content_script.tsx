// import { urlChanged } from "./content/page/update";
import { Messages } from "./common/enums";
import { Channel, Video } from "./common/types";

import "./content/listeners/onNewVideo";

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
