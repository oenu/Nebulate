import { Messages } from "./enums";

export type Video = {
  known: boolean; // If the Youtube video is from a Nebula Channel
  videoId: string; // The video id from the url
  matched: boolean; // If the Youtube video is matched to a Nebula Video
  channelSlug?: string; // The channel slug if the video is from a Nebula Channel
  channelId?: string; // The youtube channel id if the video is from a Nebula Channel
  videoSlug?: string; // The video slug if the video is matched to a Nebula Video
};

export type Channel = {
  known: boolean; // If the Youtube channel is a Nebula Channel
  slug?: string; // The channel slug
  channelId?: string; // The youtube channel id
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
