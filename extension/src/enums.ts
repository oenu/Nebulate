// Messages that can be sent between the background script and the content script
export enum Messages {
  // Messages to the content script
  NEW_VIDEO = "NEW_VIDEO", // Sent to the content script when a new video is loaded.
  CLEAR = "CLEAR", // Sent to the content script when the page is no longer a video.

  // Messages to the background script
  VIDEO_REDIRECT = "VIDEO_REDIRECT", // Sent to the background script to request a redirect to a nebula video.
  CREATOR_REDIRECT = "CREATOR_REDIRECT", // Sent to the background script to request a redirect to a channel.
}

export type Video = {
  known: boolean; // If the Youtube video is from a Nebula Channel
  videoId: string; // The video id from the url
  matched: boolean; // If the Youtube video is matched to a Nebula Video
  channelSlug?: string; // The channel slug if the video is from a Nebula Channel
  videoSlug?: string; // The video slug if the video is matched to a Nebula Video
};

// Message parameters for each message
export interface MessageParams {
  [Messages.CLEAR]: {
    // Sent to the content script when the page is no longer a video.
    type: Messages.CLEAR;
  };

  [Messages.NEW_VIDEO]: {
    // Sent to the content script when a new video is loaded.
    type: Messages.NEW_VIDEO;
    video: Video;
  };

  [Messages.VIDEO_REDIRECT]: {
    // Sent to the background script to request a redirect to a nebula video.
    type: Messages.VIDEO_REDIRECT;
    videoSlug: string; // The nebula video slug to redirect to
  };

  [Messages.CREATOR_REDIRECT]: {
    // Sent to the background script to request a redirect to a channel.
    type: Messages.CREATOR_REDIRECT;
    channelSlug: string; // The nebula channel slug to redirect to
  };
}

export enum Alarms {
  UPDATE_LOOKUP_TABLE = "UPDATE_LOOKUP_TABLE",
}

export enum CSS {
  NEBULA_VIDEO = "NEBULA_VIDEO",
  CREATOR = "CREATOR",
}

export enum CSS_CLASSES {
  NEBULA = "nebulate-video-css",
  CREATOR = "nebulate-channel-css",
  NEBULA_VIDEO_BTN = "nebulate-video-btn",
  CREATOR_BUTTON = "nebulate-channel-btn",
}
