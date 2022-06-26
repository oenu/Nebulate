import { refreshTable } from "./functions/refreshTable";

export const server_url = "http://localhost:3000";

let currentVideo_url = "";

// When the page url is equal to a youtube video url, send a message to the content script.
chrome.tabs.onUpdated.addListener(function (tabId, _changeInfo, tab) {
  try {
    if (currentVideo_url == tab.url) {
      return;
    }
    if (tab.status === "complete") {
      if (tab.url && tab.url.includes("youtube.com/watch")) {
        currentVideo_url = tab.url;
        // Strip out the video id from the url.
        const queryParameters = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);
        console.log("sending message to content script");
        console.log(urlParameters.get("v"));

        chrome.tabs.sendMessage(tabId, {
          type: "NEW",
          videoId: urlParameters.get("v"),
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
});

chrome.runtime.onMessage.addListener(function (request) {
  try {
    console.log(
      "background.js: received redirect request from content script: " +
        JSON.stringify(request)
    );
    if (request.type === "NEBULA_REDIRECT") {
      chrome.tabs.create({ url: request.url });
    } else if (request.type === "REDIRECT_REQUEST") {
    }
  } catch (error) {
    console.log(error);
  }
});

// Background functions ======================================================

chrome.runtime.onInstalled.addListener(async function () {
  try {
    console.log("set server_url to: " + server_url);
    fetch(`${server_url}/api/install`, {
      method: "POST",
    });
    console.log("background.js: installed");
    await refreshTable();
  } catch (error) {
    console.log(error);
  }
});

chrome.runtime.onStartup.addListener(async function () {
  try {
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
      }
    });
    chrome.alarms.create("refreshTable", {
      delayInMinutes: 900,
    });
  } catch (error) {
    console.log(error);
  }
});

chrome.alarms.onAlarm.addListener(async function (alarm) {
  console.log("background.js: alarm triggered: " + alarm.name);
  if (alarm.name === "refreshTable") {
    await refreshTable();
  }
});
