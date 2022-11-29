import { Messages } from "./common/enums";
import { updateTable } from "./background/updateTable";

// Content Script Messages
import {
  VideoRedirectMessage,
  ChannelRedirectMessage,
  UrlUpdateMessage,
} from "./content_script";
import { PopupRedirectMessage } from "./popup";
import { summarizeTable } from "./background/summarizeTable";
import { urlChecker } from "./background/urlChecker";

console.log("Background script running");
// Config Variables
const defaults = {
  // Time to wait before refreshing the lookup table.
  updateInterval: 60 * 4,
  // Whether to open in a new tab or the current tab.
  preferNewTab: true,
  // Whether to show the channel redirect button on a youtube page.
  showChannelButton: true,
  // Whether to show the video redirect button on a youtube player.
  showVideoButton: true,

  // Development mode
  devUpdateInterval: 5,
};

const version = "0.1.0";

/**
 * Listener Tasks
 * 1. If a content script sends a message to the background script, handle it
 * 1.1 If the message is to open the Nebula page for a video, open the Nebula page for that video
 * 1.2 If the message is to open the Nebula page for a channel, open the Nebula page for that channel
 *
 * 2. If a popup script sends a message to the background script, handle it
 * 2.1 If the message is to open a url, open the url in a new tab
 * 2.2 If the message is to refresh the lookup table, refresh the lookup table
 * 2.3 If the message is to report an error, open a mailto link to report the error
 * 2.4 If the message is to summarize the lookup table, summarize the lookup table
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    chrome.storage.sync.get("preferNewTab").then((result) => {
      const preferNewTab = result.preferNewTab ?? defaults.preferNewTab;
      switch (request.type) {
        // 1.
        // Content Script Messages

        // 1.1
        // Open the Nebula page for a video
        case Messages.VIDEO_REDIRECT: {
          const message = request as VideoRedirectMessage;
          const video = message.video;
          if (video.matched) {
            console.debug("BG: known video redirect: " + video.videoSlug);
            const url = `https://nebula.app/videos/${video.videoSlug}`;
            if (preferNewTab || sender.tab === undefined) {
              chrome.tabs.create({ url });
            } else {
              chrome.tabs.update(request.tabId, { url });
            }
          } else {
            console.debug("BG: unknown video redirect: " + video.videoSlug);
          }
          break;
        }

        // 1.2
        // Open the Nebula page for a channel
        case Messages.CHANNEL_REDIRECT: {
          const message = request as ChannelRedirectMessage;
          const channel = message.channel;
          console.debug("BG: channel redirect: " + channel.slug);
          if (channel.known) {
            const url = `https://nebula.app/${channel.slug}`;
            if (preferNewTab || sender.tab === undefined) {
              chrome.tabs.create({ url });
            } else {
              chrome.tabs.update(request.tabId, { url });
            }
          }
          break;
        }

        // 2.
        // Popup Script Messages

        // 2.1
        // Open a url
        case Messages.POPUP_REDIRECT: {
          const message = request as PopupRedirectMessage;
          const url = message.url;

          console.debug("BG: popup redirect: " + request.url);
          if (url) chrome.tabs.create({ url });
          break;
        }

        // 2.2
        // Refresh the lookup table
        case Messages.REFRESH_TABLE: {
          console.debug("BG: refresh table");
          updateTable();
          break;
        }

        // 2.3
        // Report an error
        case Messages.REPORT_ISSUE: {
          console.debug("BG: report issue");
          const message =
            "Issue: " + new Date().toISOString() + " Version: " + version;
          const url = `mailto:oenu.dev@gmail.com?subject=YouTube%20Nebula%20Extension%20Issue&body=${message}`;
          chrome.tabs.create({ url });
          break;
        }

        // 2.4
        // Summarize the lookup table
        case Messages.SUMMARIZE_TABLE: {
          console.debug("BG: summarize table");
          summarizeTable().then((summary) => {
            sendResponse(summary);
          });
          break;
        }

        default: {
          console.log("Unknown message type");
          break;
        }
      }
    });
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onMessage.addListener: ", e);
  }

  return true;
});

// Imports
import "./background/alarms/updateTableAlarm";
