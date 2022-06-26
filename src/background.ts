import { checkTable } from "./functions/checkTable";
import { refreshTable } from "./functions/refreshTable";
import requestSlug from "./functions/requestSlug";

export const server_url = "http://localhost:3000";

let currentVideo_url = "";

// When the page url is equal to a youtube video url, send a message to the content script.
chrome.tabs.onUpdated.addListener(async function (tabId, _changeInfo, tab) {
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
        const videoId = urlParameters.get("v");

        if (videoId) {
          // Check the local table for the given url
          await checkTable(videoId).then((video) => {
            if (video) {
              // Send the video id and slug to the content script.
              chrome.tabs.sendMessage(tabId, {
                known: video.known,
                type: "NEW_VIDEO",
                videoId: videoId,
                slug: video.slug,
                matched: video.matched,
              });
            }
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
});

chrome.runtime.onMessage.addListener(async function (request) {
  try {
    console.log(
      "background.js: received redirect request from content script: " +
        JSON.stringify(request)
    );
    if (request.type === "NEBULA_REDIRECT") {
      // Request the slug from the server.
      console.log(request);
      const nebula_slug = await requestSlug(request.url);
      console.log("background.js: received slug: " + nebula_slug);

      chrome.tabs.create({
        url: `https://nebula.app/videos/${nebula_slug}`,
        active: true,
      });
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
