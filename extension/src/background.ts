import { checkTable } from "./functions/checkTable";
import { refreshTable } from "./functions/refreshTable";
import { Alarms, MessageParams, Messages } from "./enums";

// export const server_url = "http://143.244.213.109:3000";
export const server_url = "http://localhost:3000";

const redirect_preference = false;

let urlCache: string;

// Watch for changes to tabs and send a message to the content script when a new video is loaded
// ================ Tab Change Listener ================= //
chrome.tabs.onUpdated.addListener(async function (tabId, _changeInfo, tab) {
  try {
    // If the tab is not fully loaded, return
    if (tab.status !== "complete") return;

    // If a tab doesn't have a url, return
    if (!tab.url) {
      return;
    }

    // If the url has already been checked, return
    if (urlCache === tab.url) {
      console.debug("background.js: video already checked");
      return;
    }

    // If the url is not a youtube video, return
    if (!tab.url.includes("youtube.com/watch")) {
      // chrome.tabs.sendMessage(tabId, {
      //   type: Messages.CLEAR,
      // });
      return;
    }

    // If the url is a youtube video, check the table
    urlCache = tab.url;
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const videoId = urlParameters.get("v");

    // If the videoId is not found, return
    if (!videoId) return;

    // Check the lookup table to see if the video is known or matched
    const video = await checkTable(videoId);

    // If the video is known, send a message to the content script with the video information
    if (video.known) {
      const message: MessageParams["NEW_VIDEO"] = {
        type: Messages.NEW_VIDEO,
        video,
      };
      chrome.tabs.sendMessage(tabId, {
        ...message,
      });
    } else {
      // If the video is not known, send a message to the content script to clear the page
      const message: MessageParams["CLEAR"] = {
        type: Messages.CLEAR,
      };
      chrome.tabs.sendMessage(tabId, {
        ...message,
      });
    }
  } catch (error) {
    console.debug(error);
  }
});

// ================== Message Listeners ================== //

// Listen for redirect messages from the content script
chrome.runtime.onMessage.addListener(async function (request, sender) {
  try {
    switch (request.type) {
      // Log the message - for debugging
      case Messages.VIDEO_REDIRECT:
        console.debug(
          "background.js: received redirect request from content script: " +
            JSON.stringify(request)
        );

        // Add typing to request
        const message: MessageParams[Messages.VIDEO_REDIRECT] = {
          type: Messages.VIDEO_REDIRECT,
          videoSlug: request.videoSlug,
        };

        // Extract the video slug from the message
        const videoSlug = message.videoSlug;

        // Check if the videoSlug is valid
        if (videoSlug && videoSlug.length > 0) {
          // Check if the redirect preference is set to new tab or current tab ( true = new tab, false = current tab)
          chrome.storage.local.get("preferNewTab", (result) => {
            // If the preference is set to new tab, open the video in a new tab
            if (result.preferNewTab === true) {
              chrome.tabs.create({
                url: `https://nebula.app/videos/${videoSlug}`,
                active: true,
              });
            } else {
              // If the preference is set to current tab, open the video in the current tab
              chrome.tabs.update(request.tabId, {
                url: `https://nebula.app/videos/${videoSlug}`,
              });
            }
          });
        } else {
          console.debug("background.js: bad video slug");
          throw new Error("bad video slug");
        }
        break;

      case Messages.CREATOR_REDIRECT:
        // Log the message - for debugging
        console.debug(
          "background.js: received Channel redirect request from content script: " +
            JSON.stringify(request)
        );

        // Add typing to request
        const channelMessage: MessageParams[Messages.CREATOR_REDIRECT] = {
          type: Messages.CREATOR_REDIRECT,
          channelSlug: request.channelSlug,
        };

        // Extract the channel slug from the message
        const channelSlug = channelMessage.channelSlug;

        // Check if the channelSlug is valid
        if (channelSlug && channelSlug.length > 0) {
          // Check if the redirect preference is set to new tab or current tab ( true = new tab, false = current tab)
          chrome.storage.local.get("preferNewTab", (result) => {
            // If the preference is set to new tab, open the channel in a new tab
            if (result.preferNewTab === true) {
              chrome.tabs.create({
                url: `https://nebula.app/channels/${channelSlug}`,
                active: true,
              });
            } else {
              // If the preference is set to current tab, open the channel in the current tab
              chrome.tabs.update(request.tabId, {
                url: `https://nebula.app/channels/${channelSlug}`,
              });
            }
          });
        } else {
          console.debug("background.js: bad channel slug");
          throw new Error("bad channel slug");
        }
        break;
    }
  } catch (error: any) {
    console.debug(error);
  }
});

// ================== First Install Functions ================== //
chrome.runtime.onInstalled.addListener(async function () {
  // Check if this is a first install
  chrome.storage.local.get("installed", (result) => {
    if (result.installed === true) {
      // This is not the first install
      console.debug("background.js: not first install");
      return;
    } else {
      // This is the first install
      console.debug("background.js: first install");
      chrome.storage.local.set({ installed: true });
      fetch(`${server_url}/api/install`, {
        method: "POST",
      });
    }
  });

  chrome.storage.local.set({ preferNewTab: false });
  try {
    console.debug("set server_url to: " + server_url);
    console.debug("background.js: installed");
    await refreshTable();

    console.debug((await chrome.management.getSelf()).installType);
    setUpdateTableAlarm();
  } catch (error) {
    console.debug(error);
  }
});

// ================== Startup: Table Refresh Function ================== //
chrome.runtime.onStartup.addListener(async function () {
  // Check when the lookup table was last updated
  chrome.storage.local.get("lastUpdated", async (result) => {
    if (result.lastUpdated) {
      const lastUpdated = new Date(result.lastUpdated);
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 6) {
        console.debug("background.js: last updated more than 6 hours ago");
        await refreshTable();
      }
    } else {
      console.debug("background.js: last updated never");
      await refreshTable();
    }
  });
});

// ================== Alarm Scheduler ================== //
chrome.alarms.get(Alarms.UPDATE_LOOKUP_TABLE, (alarm) => {
  if (alarm) {
    console.debug("background.js: alarm exists");
  } else {
    console.debug("background.js: alarm does not exist");
    setUpdateTableAlarm();
  }
});

const setUpdateTableAlarm = async (interval?: number) => {
  console.debug("background.js: setting alarm");
  if (interval) {
    console.debug(
      "background.js: Setting table update alarm with interval: " + interval
    );
    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      delayInMinutes: interval,
    });
    return;
  }

  if ((await chrome.management.getSelf()).installType === "development") {
    console.debug(
      "background.js: Development mode: scheduling update every 2 hours"
    );
    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      delayInMinutes: 2 * 60,
    });
  } else {
    console.debug("background.js: scheduling update every 6 hours");
    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      delayInMinutes: 6 * 60,
    });
  }
};

chrome.alarms.onAlarm.addListener(async function (alarm) {
  console.debug("background.js: alarm triggered: " + alarm.name);
  switch (alarm.name) {
    case Alarms.UPDATE_LOOKUP_TABLE:
      await refreshTable();
      break;
    default:
      console.debug("background.js: unknown alarm");
  }
});
