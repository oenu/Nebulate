import { Channel } from "../../common/types";

// Open the Nebula page for a given channel
export const channelRedirect = (
  channel: Channel,
  preferNewTab: boolean,
  tabId?: number
): void => {
  console.info(
    `channelRedirect(channel:${channel}, preferNewTab:${preferNewTab}, tabId:${tabId})`
  );
  if (channel.known) {
    console.debug("BG: known channel redirect: " + channel.slug);
    const url = `https://nebula.app/${channel.slug}`;
    if (preferNewTab || tabId === undefined) {
      chrome.tabs.create({ url });
    } else {
      chrome.tabs.update(tabId, { url });
    }
  } else {
    console.warn("channelRedirect: unknown channel redirect: " + channel.slug);
  }
};
