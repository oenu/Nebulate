import { refreshTable } from "./functions/refreshTable";
import { getInstallType } from "./utils/getInstallType";

declare global {
  var server: string;
}
(async () => {
  global.server = await getInstallType();
  console.log("background.js: server: " + server);
})();

// When the page url is equal to a youtube video url, send a message to the content script.
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log(tab.url);
  if (tab.status === "complete") {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      // Strip out the video id from the url.
      const queryParameters = tab.url.split("?")[1];
      const urlParameters = new URLSearchParams(queryParameters);
      chrome.tabs.sendMessage(tabId, {
        type: "NEW",
        videoId: urlParameters.get("v"),
      });
    }
  }
});

chrome.runtime.onMessage.addListener(function (request) {
  console.log(
    "background.js: received redirect request from content script: " +
      JSON.stringify(request)
  );
  if (request.type === "NEBULA_REDIRECT") {
    chrome.tabs.create({ url: request.url });
  } else if (request.type === "REDIRECT_REQUEST") {
  }
});

// Background functions ======================================================

chrome.runtime.onInstalled.addListener(async function () {
  console.log("background.js: onInstalled");
  fetch(`${server}/api/install`, {
    method: "POST",
  });
  await refreshTable();
});

chrome.runtime.onStartup.addListener(async function () {
  console.log("background.js: onStartup");

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
});

chrome.alarms.onAlarm.addListener(async function (alarm) {
  console.log("background.js: alarm triggered: " + alarm.name);
  if (alarm.name === "refreshTable") {
    await refreshTable();
  }
});
