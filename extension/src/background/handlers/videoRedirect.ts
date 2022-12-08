import { Video } from "../../common/types";

// Open the Nebula page for a given video
export const videoRedirect = (
  video: Video | string,
  preferNewTab: boolean,
  tabId?: number
): void => {
  console.info(
    `videoRedirect(video:${video}, preferNewTab:${preferNewTab}, tabId:${tabId})`
  );
  if (typeof video === "string") {
    const url = `https://nebula.app/videos/${video}`;
    if (preferNewTab || tabId === undefined) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update(tabId, { url });
    }
  } else if (video.slug) {
    const url = `https://nebula.app/videos/${video.slug}`;
    if (preferNewTab || tabId === undefined) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update(tabId, { url });
    }
  }
};
