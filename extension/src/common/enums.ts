/* eslint-disable no-unused-vars */

// Messages that can be sent between the background script and the content script
export enum Messages {
  // Messages to the content script
  CLEAR = "CLEAR", // Sent to the content script when the page is no longer a video.

  // Messages to the background script
  VIDEO_REDIRECT = "VIDEO_REDIRECT", // Sent to the background script to request a redirect to a nebula video.
  CHANNEL_REDIRECT = "CHANNEL_REDIRECT", // Sent to the background script to request a redirect to a channel.
  CHECK_VIDEO = "CHECK_VIDEO", // Sent to the background script to check if the current page is a video.
  CHECK_VIDEO_RESPONSE = "CHECK_VIDEO_RESPONSE", // Sent to the content script to respond to a CHECK_VIDEO message.

  // Direct Messages to the content script
  CHECK_URL_RESULT = "CHECK_URL_RESULT", // Sent to the content script when the URL is checked (on change)
  ADD_VIDEO_BUTTON = "ADD_VIDEO_BUTTON", // Sent to the content script to add a button to the video player.
  REMOVE_VIDEO_BUTTON = "REMOVE_VIDEO_BUTTON", // Sent to the content script to remove the button from the video player.
  ADD_CHANNEL_BUTTON = "ADD_CHANNEL_BUTTON", // Sent to the content script to add a button to the channel page.
  REMOVE_CHANNEL_BUTTON = "REMOVE_CHANNEL_BUTTON", // Sent to the content script to remove the button from the channel page.
  URL_UPDATE = "URL_UPDATE", // Sent to the content script to update the URL.

  // Messages from the popup
  POPUP_REDIRECT = "POPUP_REDIRECT", // Sent from the popup to request a redirect to a social media page for the developer.
  REFRESH_TABLE = "REFRESH_TABLE", // Sent from the popup to request a refresh of the table.
  REPORT_ISSUE = "REPORT_ISSUE", // Sent from the popup to send a report issue email.
  SUMMARIZE_TABLE = "SUMMARIZE_TABLE", // Sent from the popup to request a summary of the table.
}

// Message parameters for each message
export enum Alarms {
  UPDATE_LOOKUP_TABLE = "UPDATE_LOOKUP_TABLE",
}

export enum CSS {
  NEBULA_VIDEO = "NEBULA_VIDEO",
  CHANNEL = "CHANNEL",
}

export enum CSS_IDS {
  VIDEO = "nebulate-video-css", // The id of the video css element.
  CHANNEL = "nebulate-channel-css", // The id of the channel css element.
  NEBULA_VIDEO_BTN = "nebulate-video-btn", // The id of the button that is added to the video player.
  CHANNEL_BUTTON = "nebulate-channel-btn", // The id of the button that redirects to the channel page.
  BULK_VIDEO = "nebulate-bulk", // Used for styling many videos at once
}

export enum CSS_CLASSES {
  VIDEO_BUTTON = "nebulate-video-btn",
  CHANNEL_BUTTON = "nebulate-channel-btn",
}

export enum BUTTON_IDS {
  VIDEO = "nebulate-video-btn",
  CHANNEL = "nebulate-channel-btn",
}
