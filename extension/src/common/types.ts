import { Messages } from "./enums";

export type Video = {
  videoId: string; // The video id from the url
  known: boolean; // If the Youtube video is from a Nebula Channel
  matched: boolean; // If the Youtube video is matched to a Nebula Video
  slug: string | undefined; // The video slug if the video is matched to a Nebula Video
  channel: Channel; // The channel object if the video is from a Nebula Channel
};

export type Channel = {
  known: boolean; // If the Youtube channel is a Nebula Channel
  slug: string | undefined; // The channel slug
  custom_url: string | undefined; // The channel custom url
  id: string | undefined; // The youtube channel id
};

export type MessageTypes = {
  [Messages.CLEAR]: {
    params: void;
  };
  [Messages.VIDEO_REDIRECT]: {
    // Sent to the background script to request a redirect to a nebula video.
    params: Video;
  };
  [Messages.CHANNEL_REDIRECT]: {
    // Sent to the background script to request a redirect to a channel.
    params: Channel;
  };
  [Messages.ADD_VIDEO_BUTTON]: {
    // Sent to the content script to add a button to the video player.
    params: Video;
  };
  [Messages.REMOVE_VIDEO_BUTTON]: {
    // Sent to the content script to remove the button from the video player.
    params: void;
  };
  [Messages.ADD_CHANNEL_BUTTON]: {
    // Sent to the content script to add a button to the channel page.
    params: Channel;
  };
  [Messages.REMOVE_CHANNEL_BUTTON]: {
    // Sent to the content script to remove the button from the channel page.
    params: void;
  };
  [Messages.POPUP_REDIRECT]: {
    // Sent from the popup to request a redirect to a url.
    params: string;
  };
  [Messages.REFRESH_TABLE]: {
    // Sent from the popup to request a refresh of the lookup table.
    params: void;
  };
  [Messages.SUMMARIZE_TABLE]: {
    // Sent from the popup to request a summary of the lookup table.
    params: void;
  };
  [Messages.REPORT_ISSUE]: {
    // Sent from the popup to send a report issue email.
    params: void;
  };
};

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
