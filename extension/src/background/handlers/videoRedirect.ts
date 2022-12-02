import { Video } from "../../common/types";

// Open the Nebula page for a given video
export const videoRedirect = (
  video: Video,
  preferNewTab: boolean,
  tabId?: number
): void => {
  console.info(
    `videoRedirect(video:${video}, preferNewTab:${preferNewTab}, tabId:${tabId})`
  );
  if (video.matched) {
    const url = `https://nebula.app/videos/${video.slug}`;
    if (preferNewTab || tabId === undefined) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update(tabId, { url });
    }
  } else {
    console.warn("videoRedirect: unknown video redirect: " + video.slug);
  }
};
