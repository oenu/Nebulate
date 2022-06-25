// Register a listener that runs in the background.
console.log("background.js");
let server: string;

// Check if in development mode.
chrome.management.getSelf((info) => {
  switch (info.installType) {
    case "development":
      console.log("background.js: in development mode");
      server = "http://localhost:3000/";
      break;
    case "normal":
      server = ""; // TODO: #2 Set up a server for production.
      break;
    case "sideload":
      throw new Error("Sideloading is not supported.");
      break;
    case "other":
      throw new Error("Other install types are not supported.");
      break;
    default:
      break;
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // When the page url is equal to a youtube video url, send a message to the content script.
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
  }
});

chrome.runtime.onStartup.addListener(function () {
  console.log("background.js: onStartup");
  // Check when last updated
  chrome.storage.sync.get("lastUpdated", (result) => {
    if (result.lastUpdated) {
      const lastUpdated = new Date(result.lastUpdated);
      const now = new Date();
      const diff = now.getTime() - lastUpdated.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 6) {
        console.log("background.js: last updated more than 6 hours ago");
        refreshLookupTable()
          .then(() => {
            console.log("background.js: lookup table refreshed");
          })
          .catch((err) => {
            console.log("background.js: error refreshing lookup table: " + err);
          });
      }
    }
  });
});

const refreshLookupTable = async (): Promise<void> => {
  // IDEA: #3 Send the current version number of lookup table to server when requesting a new one.
  fetch(`${server}/api/table`)
    .then((response) => response.json())
    .then((data) => {
      console.log("background.js: fetched lookup table");
      console.log(data);
      chrome.storage.sync.set({ lookupTable: data });
      chrome.storage.sync.set({ lastUpdated: new Date() });
      Promise.resolve;
    })
    .catch((error) => {
      console.log("background.js: error fetching lookup table");
      console.log(error);
      Promise.reject(error);
    });
};

// First Install or Update
chrome.runtime.onInstalled.addListener(function () {
  fetch(`${server}/api/register`, {
    method: "POST",
  });
  refreshLookupTable();
});

interface LookupTable {
  url: string;
  slug: string;
  matched: boolean;
}
