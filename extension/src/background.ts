import { Messages, Alarms } from "./enums";
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

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log("Tab Detected");
  try {
    if (changeInfo.status === "complete") {
      if (tab.url) {
        urlChecker(tab.url, tabId);
        const urlMessage: UrlUpdateMessage = {
          type: Messages.URL_UPDATE,
          url: tab.url,
        };
        chrome.tabs.sendMessage(tabId, urlMessage);
      } else {
        console.debug("BG: No URL found for tab: ", tab);
        return;
      }
    }
  } catch (e) {
    console.log("BG: Error in onUpdated listener: ", e);
  }
});

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

/**
 * Listener Tasks:
 * 1. On first install, set default preferences
 * 1.1 Set pref for opening Nebula links in a new tab
 * 1.2 Set pref for showing the channel button
 * 1.3 Set pref for showing the video button
 * 1.4 Set pref for time to wait before refreshing the lookup table
 * 2. On first install, set whether the extension is in development mode
 * 3. On first install or update, trigger a refresh of the lookup table
 */
chrome.runtime.onInstalled.addListener(async function () {
  // 1.
  // Set default preferences
  try {
    // 1.1
    // Set pref for opening Nebula links in a new tab
    const storage = await chrome.storage.sync.get("preferNewTab");
    if (storage.preferNewTab === undefined) {
      chrome.storage.sync.set({ preferNewTab: defaults.preferNewTab });
    }

    // 1.2
    // Set pref for showing the channel button
    const showChannelButton = await chrome.storage.sync.get(
      "showChannelButton"
    );
    if (showChannelButton.showChannelButton === undefined) {
      chrome.storage.sync.set({
        showChannelButton: defaults.showChannelButton,
      });
    }

    // 1.3
    // Set pref for showing the video button
    const showVideoButton = await chrome.storage.sync.get("showVideoButton");
    if (showVideoButton.showVideoButton === undefined) {
      chrome.storage.sync.set({ showVideoButton: defaults.showVideoButton });
    }

    // 1.4
    // Set pref for time to wait before refreshing the lookup table
    const updateInterval = await chrome.storage.sync.get("updateInterval");
    if (updateInterval.updateInterval === undefined) {
      chrome.storage.sync.set({ updateInterval: defaults.updateInterval });
    }

    // 2
    // Set whether the extension is in development mode
    const devMode =
      (await chrome.management.getSelf()).installType === "development";
    chrome.storage.local.set({ devMode });

    // 3
    // Trigger a refresh of the lookup table
    await updateTable();
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onInstalled.addListener: ", e);
  }
});

/**
 * Listener Tasks:
 * 1. On startup, check if the extension is in development mode
 * 1.1 If the extension is in development mode, update the lookup table
 * 2. On startup in production, check if the lookup table needs to be updated
 * 2.1 If the lookup table has never been fetched, fetch it
 * 2.2 If the lookup table is out of date, fetch it
 */
chrome.runtime.onStartup.addListener(async function () {
  try {
    // 1
    // Check if the extension is in development mode
    const devMode =
      (await chrome.management.getSelf()).installType === "development";

    // 1.1
    // If the extension is in development mode, update the lookup table
    if (devMode) {
      await updateTable();
    } else {
      // 2
      // On startup in production, check if the lookup table needs to be updated
      const lastUpdated = await chrome.storage.local.get("lastUpdated");
      const lastUpdatedDate = new Date(lastUpdated.lastUpdated);
      const now = new Date();

      // 2.1
      // If the lookup table has never been fetched, fetch it
      if (lastUpdated.lastUpdated === undefined) {
        await updateTable();
      } else {
        // 2.2
        // If the lookup table is out of date, fetch it
        const updateInterval = await chrome.storage.sync.get("updateInterval");
        const interval =
          updateInterval.updateInterval ?? defaults.updateInterval;
        if (now.getTime() - lastUpdatedDate.getTime() >= interval) {
          await updateTable();
        }
      }
    }
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onStartup.addListener: ", e);
  }
});

/**
 * Alarm Tasks:
 * 1. If the alarm is to refresh the lookup table, refresh the lookup table
 */
chrome.alarms.get(Alarms.UPDATE_LOOKUP_TABLE, (alarm) => {
  try {
    if (alarm) {
      console.debug("BG: alarm exists");
    } else {
      console.debug("BG: alarm does not exist");
      setUpdateTableAlarm();
    }
  } catch (e) {
    console.log("BG: Error in chrome.alarms.get: ", e);
  }
});

/**
 * Helper Function Tasks:
 * 1. If the update table alarm already exists, clear it
 * 2. Get the update interval preference
 * 3. Set the update table alarm
 * 3.1. If the update interval is 0, do not set the alarm
 */
const setUpdateTableAlarm = async (interval?: number): Promise<void> => {
  try {
    // 1
    chrome.alarms.clear(Alarms.UPDATE_LOOKUP_TABLE);
    // 2
    const updateInterval = await chrome.storage.sync.get("updateInterval");
    const updateIntervalMinutes =
      updateInterval.updateInterval ?? defaults.updateInterval;
    // 3
    if (updateIntervalMinutes > 0) {
      chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
        delayInMinutes: interval ?? updateIntervalMinutes,
        periodInMinutes: updateIntervalMinutes,
      });
    }
  } catch (e) {
    console.log("BG: Error in setUpdateTableAlarm: ", e);
  }
};

/**
 * Alarm Tasks:
 * 1. If the alarm is to refresh the lookup table, refresh the lookup table
 */
chrome.alarms.onAlarm.addListener(async function (alarm) {
  try {
    console.debug("BG: alarm triggered: " + alarm.name);
    // 1
    switch (alarm.name) {
      case Alarms.UPDATE_LOOKUP_TABLE:
        await updateTable();
        break;
      default:
        console.debug("BG: unknown alarm");
    }
  } catch (e) {
    console.log("BG: Error in chrome.alarms.onAlarm.addListener: ", e);
  }
});
