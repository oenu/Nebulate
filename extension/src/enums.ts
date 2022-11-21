/* eslint-disable no-unused-vars */

// Messages that can be sent between the background script and the content script
export enum Messages {
  // Messages to the content script
  CLEAR = "CLEAR", // Sent to the content script when the page is no longer a video.

  // Messages to the background script
  VIDEO_REDIRECT = "VIDEO_REDIRECT", // Sent to the background script to request a redirect to a nebula video.
  CHANNEL_REDIRECT = "CHANNEL_REDIRECT", // Sent to the background script to request a redirect to a channel.

  // Direct Messages
  ADD_VIDEO_BUTTON = "ADD_VIDEO_BUTTON", // Sent to the content script to add a button to the video player.
  REMOVE_VIDEO_BUTTON = "REMOVE_VIDEO_BUTTON", // Sent to the content script to remove the button from the video player.
  ADD_CHANNEL_BUTTON = "ADD_CHANNEL_BUTTON", // Sent to the content script to add a button to the channel page.
  REMOVE_CHANNEL_BUTTON = "REMOVE_CHANNEL_BUTTON", // Sent to the content script to remove the button from the channel page.

  // Messages from the popup
  POPUP_REDIRECT = "POPUP_REDIRECT", // Sent from the popup to request a redirect to a social media page for the developer.
  REFRESH_TABLE = "REFRESH_TABLE", // Sent from the popup to request a refresh of the table.
  REPORT_ISSUE = "REPORT_ISSUE", // Sent from the popup to send a report issue email.
}

// Message parameters for each message
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
