// Register a listener that runs in the background.
console.log("background.js");

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // console.log(tab);
  // When the page url is equal to a youtube video url, send a message to the content script.
  console.log(changeInfo);
  console.log(tab);
  if (tab.status === "complete") {
    if (tab.url && tab.url.includes("youtube.com/watch")) {
      // Strip out the video id from the url.
      console.log("background.js: sending message to content script");
      // console.log(tab.url);

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
