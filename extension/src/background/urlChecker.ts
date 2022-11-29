import { checkTable } from "../content/checkTable";
import { Messages } from "../common/enums";
import { Video } from "../common/types";
// This function is called when a tab is updated and contains "https://www.youtube.com/watch?v=" in the URL

// This function will check to see if the video is known in the lookup table, if it is then it will message the content script

/**
 * urlChecker
 * @param {string} url - The URL of the tab
 * @param {number} tabId - The ID of the tab
 * @returns {Video} - The video object
 */

export type CheckedUrlResult = {
  type: Messages.CHECK_URL_RESULT;
  video: Video;
};

export const urlChecker = async (url: string, tabId: number): Promise<void> => {
  if (url.includes("youtube.com/watch?v=")) {
    return checkTable([url]).then((video) => {
      if (video) {
        const message: CheckedUrlResult = {
          type: Messages.CHECK_URL_RESULT,
          video: video[0],
        };
        chrome.tabs.sendMessage(tabId, message);
      }
    });
  }
};
