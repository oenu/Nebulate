import { checkTable } from "./functions/checkTable";
import { refreshTable } from "./functions/refreshTable";
import requestSlug from "./functions/requestSlug";
import { Alarms, Messages } from "./enums";

export const server_url = "http://localhost:3000";

const redirect_preference = false;

let currentVideo_url = "";

// When the page url is equal to a youtube video url, send a message to the content script.
// Message Router
chrome.tabs.onUpdated.addListener(async function (tabId, _changeInfo, tab) {
  try {
    // Filters
    // if (currentVideo_url == tab.url) return;
    if (tab.status !== "complete") return;
    if (!tab.url || !tab.url.includes("youtube.com/watch")) {
      chrome.tabs.sendMessage(tabId, {
        type: Messages.CLEAR,
      });
      return;
    }

    // Strip out the video id from the url.
    currentVideo_url = tab.url;
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const videoId = urlParameters.get("v");
    if (!videoId) return;

    // Check the local table for the given url
    const video = await checkTable(videoId);

    if (video) {
      // Video from Nebula channel found
      chrome.tabs.sendMessage(tabId, {
        type: Messages.NEW_VIDEO,
        known: video.known, // If the Youtube video is from a Nebula Channel
        videoId: videoId, // The video id
        slug: video.channelSlug, // The channel slug
        matched: video.matched, // If the Youtube video is matched to a Nebula Video
      });
    } else {
      // Unknown Youtube Video
      chrome.tabs.sendMessage(tabId, {
        type: Messages.NEW_VIDEO,
        known: false,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

chrome.runtime.onMessage.addListener(async function (request, sender) {
  try {
    switch (request.type) {
      case Messages.NEBULA_REDIRECT:
        console.log(
          "background.js: received redirect request from content script: " +
            JSON.stringify(request)
        );
        // Fetch Slug from server
        const nebula_slug = await requestSlug(request.url);
        if (!nebula_slug) {
          console.log("background.js: no slug returned");
          return;
        }
        console.debug("background.js: received slug: " + nebula_slug);
        if (nebula_slug && nebula_slug.length > 0) {
          chrome.storage.local.get("preferNewTab", (result) => {
            if (result.preferNewTab === true) {
              chrome.tabs.create({
                url: `https://nebula.app/videos/${nebula_slug}`,
                active: true,
              });
            } else {
              chrome.tabs.update(request.tabId, {
                url: `https://nebula.app/videos/${nebula_slug}`,
              });
            }
          });
        } else {
          throw new Error("No slug returned");
          console.log("background.js: no slug returned");
        }
        break;

      case Messages.CREATOR_REDIRECT:
        console.log(
          "background.js: received Channel redirect request from content script: " +
            JSON.stringify(request)
        );

        const response = await checkTable(request.url);
        if (response?.channelSlug) {
          chrome.storage.local.get("preferNewTab", (result) => {
            if (result.preferNewTab === true) {
              chrome.tabs.create({
                url: `https://nebula.app/${response.channelSlug}`,
                active: true,
              });
            } else {
              chrome.tabs.update(request.tabId, {
                url: `https://nebula.app/${response.channelSlug}`,
              });
            }
          });
        }
        break;
    }
  } catch (error: any) {
    console.log(error);
    if (error.message === "No slug returned") {
      chrome.tabs.sendMessage(request.tabId, {
        type: Messages.NO_SLUG_REDIRECT,
      });
    }
  }
});

// Background functions ======================================================

chrome.runtime.onInstalled.addListener(async function () {
  chrome.storage.local.set({ preferNewTab: false });
  try {
    console.log("set server_url to: " + server_url);
    fetch(`${server_url}/api/install`, {
      method: "POST",
    });
    console.log("background.js: installed");
    await refreshTable();

    console.log((await chrome.management.getSelf()).installType);
    setUpdateTableAlarm();
  } catch (error) {
    console.log(error);
  }
});

chrome.runtime.onStartup.addListener(async function () {
  // Check when the lookup table was last updated
  chrome.storage.local.get("lastUpdated", async (result) => {
    if (result.lastUpdated) {
      const lastUpdated = new Date(result.lastUpdated);
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 6) {
        console.log("background.js: last updated more than 6 hours ago");
        await refreshTable();
      }
    } else {
      console.log("background.js: last updated never");
      await refreshTable();
    }
  });
});

// Schedule the lookup table update
// Check for alarms
chrome.alarms.get(Alarms.UPDATE_LOOKUP_TABLE, (alarm) => {
  if (alarm) {
    console.log("background.js: alarm exists");
  } else {
    console.log("background.js: alarm does not exist");
    setUpdateTableAlarm();
  }
});

const setUpdateTableAlarm = async (interval?: number) => {
  console.log("background.js: setting alarm");
  if (interval) {
    console.log(
      "background.js: Setting table update alarm with interval: " + interval
    );
    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      delayInMinutes: interval,
    });
    return;
  }

  if ((await chrome.management.getSelf()).installType === "development") {
    console.log(
      "background.js: Development mode: scheduling update every 2 hours"
    );
    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      delayInMinutes: 2 * 60,
    });
  } else {
    console.log("background.js: scheduling update every 12 hours");
    chrome.alarms.create(Alarms.UPDATE_LOOKUP_TABLE, {
      delayInMinutes: 12 * 60,
    });
  }
};

chrome.alarms.onAlarm.addListener(async function (alarm) {
  console.log("background.js: alarm triggered: " + alarm.name);
  switch (alarm.name) {
    case Alarms.UPDATE_LOOKUP_TABLE:
      await refreshTable();
      break;
    default:
      console.log("background.js: unknown alarm");
  }
});
