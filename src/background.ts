import { checkTable } from "./functions/checkTable";
import { refreshTable } from "./functions/refreshTable";
import requestSlug from "./functions/requestSlug";

export const server_url = "http://localhost:3000";
console.log("canyouhearme");
const redirect_preference = false;

let currentVideo_url = "";

// When the page url is equal to a youtube video url, send a message to the content script.

// Message Router
chrome.tabs.onUpdated.addListener(async function (tabId, _changeInfo, tab) {
  try {
    // Filters
    // if (currentVideo_url == tab.url) return;
    if (tab.status !== "complete") return;
    if (!tab.url || !tab.url.includes("youtube.com/watch")) return;

    // Strip out the video id from the url.
    currentVideo_url = tab.url;
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    const videoId = urlParameters.get("v");
    if (!videoId) return;

    // Check the local table for the given url
    const video = await checkTable(videoId);

    if (video) {
      // Video from Nebula creator found
      chrome.tabs.sendMessage(tabId, {
        type: "NEW_VIDEO",
        known: video.known, // If the Youtube video is from a Nebula Creator
        videoId: videoId, // The video id
        slug: video.slug, // The creator slug
        matched: video.matched, // If the Youtube video is matched to a Nebula Video
      });
    } else {
      // Unknown Youtube Video
      chrome.tabs.sendMessage(tabId, {
        type: "NEW_VIDEO",
        known: false,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

chrome.runtime.onMessage.addListener(async function (request) {
  try {
    if (request.type === "NEBULA_REDIRECT") {
      console.log(
        "background.js: received redirect request from content script: " +
          JSON.stringify(request)
      );

      const nebula_slug = await requestSlug(request.url);
      if (!nebula_slug) {
        console.log("background.js: no slug returned");
        return;
      }
      console.log("background.js: received slug: " + nebula_slug);

      if (nebula_slug && nebula_slug.length > 0) {
        console.log("getting from storage");
        chrome.storage.local.get("preferNewTab", (result) => {
          console.log(result.preferNewTab);
          if (result.preferNewTab === true) {
            chrome.tabs.create({
              url: `https://nebula.app/videos/${nebula_slug}`,
              active: true,
            });
          } else {
            // Redirect the user to the nebula page.
            chrome.tabs.update(request.tabId, {
              url: `https://nebula.app/videos/${nebula_slug}`,
            });
          }
        });
      } else {
        throw new Error("No slug returned");
        console.log("background.js: no slug returned");
      }
    }
  } catch (error: any) {
    console.log(error);
    if (error.message === "No slug returned") {
      chrome.tabs.sendMessage(request.tabId, {
        type: "NO_SLUG_REDIRECT",
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
