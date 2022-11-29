import { UrlUpdateMessage } from "../../content_script";
import { Messages } from "../../common/enums";
import { Video } from "../../common/types";
import { checkTable } from "../../common/checkTable";

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

export type CheckedUrlResult = {
  type: Messages.CHECK_URL_RESULT;
  video: Video;
};

export const urlChecker = async (url: string, tabId: number): Promise<void> => {
  if (url.includes("youtube.com/watch?v=")) {
    return checkTable([url]).then((video) => {
      if (video[0]) {
        const message: CheckedUrlResult = {
          type: Messages.CHECK_URL_RESULT,
          video: video[0],
        };
        chrome.tabs.sendMessage(tabId, message);
      }
    });
  }
};
