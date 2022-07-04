export enum Messages {
  NEW_VIDEO = "NEW_VIDEO", // Sent to the content script when a new video is loaded.
  CLEAR = "CLEAR", // Sent to the content script when the page is no longer a video.
  NO_SLUG_REDIRECT = "NO_SLUG_REDIRECT", // Sent to the content script when a request is made for a video that has no slug.
  NEBULA_REDIRECT = "NEBULA_REDIRECT", // Sent to the background script to request a redirect to a nebula video.
  CREATOR_REDIRECT = "CREATOR_REDIRECT", // Sent to the background script to request a redirect to a channel.
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
