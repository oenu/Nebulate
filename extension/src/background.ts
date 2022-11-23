import { Messages, Alarms } from "./enums";
import { checkTable } from "./functions/checkTable";
import { updateTable } from "./functions/updateTable";

import { Video } from "./types";

// Content Script Messages
import { VideoRedirectMessage, ChannelRedirectMessage } from "./content_script";
import { PopupRedirectMessage } from "./popup";

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
let urlCache: string;

/**
 * Listener Tasks:
 * 1. If a new video is loaded, check if it (or its creator) is on Nebula
 * 1.1 If it is on Nebula, send a message to the content script to load the CSS
 * 1.2 If it is not on Nebula, send a message to the content script to unload the CSS
 * 2. If a new page is loaded and it isn't a video page, send a message to the content script to unload the CSS
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log("Tab Detected");
  try {
    if (changeInfo.status === "complete") {
      if (tab.url?.includes("youtube.com/watch")) {
        const url = tab.url;
        console.log("Video Detected");
        if (url !== urlCache) {
          urlCache = url;
          handleNewVideo(url, tabId);
        } else {
          console.log("Video is has already been processed");
        }
      } else {
        // Not a video page
        chrome.tabs.sendMessage(tabId, {
          type: Messages.CLEAR,
        });
      }
    }
  } catch (e) {
    console.log("BG: Error in chrome.tabs.onUpdated.addListener: ", e);
  }
});

const handleNewVideo = async (url: string, tabId: number): Promise<void> => {
  try {
    const video = await checkTable(url);
    if (video) {
      handleVideo(video, tabId);
    } else {
      chrome.tabs.sendMessage(tabId, {
        type: Messages.CLEAR,
      });
    }
  } catch (e) {
    console.log("BG: Error in handleNewVideo: ", e);
  }
};

/**
 * Handler tasks
 * 1. If the channel is on Nebula, send a message to the content script to load the channel button
 * 1.1 If the channel is not on Nebula, send a message to the content script to unload the channel button
 * 2. If the video is on Nebula, send a message to the content script to load the video button
 * 2.1 If the video is not on Nebula, send a message to the content script to unload the video button
 */
const handleVideo = (video: Video, tabId: number): void => {
  console.log("BG: Video is on Nebula");
  try {
    // Channel is on Nebula?
    if (video.known) {
      chrome.tabs.sendMessage(tabId, {
        type: Messages.ADD_CHANNEL_BUTTON,
        channel: {
          known: true,
          slug: video.channelSlug,
        },
      });
    } else {
      chrome.tabs.sendMessage(tabId, {
        type: Messages.REMOVE_CHANNEL_BUTTON,
      });
    }

    // Video is on Nebula?
    if (video.matched) {
      chrome.tabs.sendMessage(tabId, {
        type: Messages.ADD_VIDEO_BUTTON,
        video,
      });
    } else {
      chrome.tabs.sendMessage(tabId, {
        type: Messages.REMOVE_VIDEO_BUTTON,
      });
    }
  } catch (e) {
    console.log("BG: Error in handleVideo: ", e);
  }
};

/**
 * Listener Tasks:
 * 1. If a content script sends a message to the background script, handle it
 * 1.1 If the message is to open the Nebula page for a video, open the Nebula page for that video
 * 1.2 If the message is to open the Nebula page for a channel, open the Nebula page for that channel
 *
 * 2. If a popup script sends a message to the background script, handle it
 * 2.1 If the message is to open a url, open the url in a new tab
 * 2.2 If the message is to refresh the lookup table, refresh the lookup table
 * 2.3 If the message is to report an error, open a mailto link to report the error
 */
chrome.runtime.onMessage.addListener(async (request, sender) => {
  try {
    // Get redirect preference
    const newTab = await chrome.storage.sync.get("preferNewTab");
    const preferNewTab = newTab.preferNewTab ?? defaults.preferNewTab;
    switch (request.type) {
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
      case Messages.REFRESH_TABLE: {
        console.debug("BG: refresh table");
        await updateTable();
        break;
      }
      case Messages.POPUP_REDIRECT: {
        const message = request as PopupRedirectMessage;
        const url = message.url;

        console.debug("BG: popup redirect: " + request.url);
        if (url) chrome.tabs.create({ url });
        break;
      }
      case Messages.REPORT_ISSUE: {
        console.debug("BG: report issue");
        const message =
          "Issue: " + new Date().toISOString() + " Version: " + version;
        const url = `mailto:oenu.dev@gmail.com?subject=YouTube%20Nebula%20Extension%20Issue&body=${message}`;
        chrome.tabs.create({ url });
        break;
      }
      default: {
        console.log("Unknown message type");
        break;
      }
    }
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onMessage.addListener: ", e);
  }
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
  try {
    // 1.1
    const storage = await chrome.storage.sync.get("preferNewTab");
    if (storage.preferNewTab === undefined) {
      // Set default preference
      chrome.storage.sync.set({ preferNewTab: defaults.preferNewTab });
    }
    // 1.2
    const showChannelButton = await chrome.storage.sync.get(
      "showChannelButton"
    );
    if (showChannelButton.showChannelButton === undefined) {
      // Set default preference
      chrome.storage.sync.set({
        showChannelButton: defaults.showChannelButton,
      });
    }
    // 1.3
    const showVideoButton = await chrome.storage.sync.get("showVideoButton");
    if (showVideoButton.showVideoButton === undefined) {
      // Set default preference
      chrome.storage.sync.set({ showVideoButton: defaults.showVideoButton });
    }
    // 1.4
    const updateInterval = await chrome.storage.sync.get("updateInterval");
    if (updateInterval.updateInterval === undefined) {
      // Set default preference
      chrome.storage.sync.set({ updateInterval: defaults.updateInterval });
    }
    // 2
    const devMode =
      (await chrome.management.getSelf()).installType === "development";
    chrome.storage.local.set({ devMode });
    // 3
    await updateTable();
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onInstalled.addListener: ", e);
  }
});

/**
 * Listener Tasks:
 * 1. On startup, check if the lookup table is out of date
 * 1.1 If the table has already been updated in the last 6 hours, do nothing
 * 1.2 If the table has not been updated in the last 6 hours, update the table
 * 1.3 If the table has never been updated, update the table
 */
chrome.runtime.onStartup.addListener(async function () {
  try {
    // 1
    chrome.storage.local.get("lastUpdate"),
      async (result: { lastUpdate: number }): Promise<void> => {
        if (result.lastUpdate) {
          const lastUpdated = new Date(result.lastUpdate);
          const now = new Date();
          const diff = now.getTime() - lastUpdated.getTime();
          const hours = Math.floor(diff / (1000 * 60 * 60));
          if (hours > 6) {
            console.debug("BG: last updated more than 6 hours ago");
            await updateTable();
          }
        } else {
          console.debug("BG: last updated never");
          await updateTable();
        }
      };
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
