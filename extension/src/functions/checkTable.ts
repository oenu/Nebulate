// Check the local table for the given url

export interface Match {
  known?: boolean;
  matched?: boolean;
  channelSlug?: string;
}

export const checkTable = async (url: string) => {
  // Check matched videos (shorter set)
  const { lookupTable } = await chrome.storage.local.get("lookupTable");

  let video: Match = {};

  // Check each channels matched videos

  for (let index = 0; index < lookupTable.channels.length; index++) {
    const channel = lookupTable.channels[index];
    if (channel.matched.includes(url)) {
      video.known = true;
      video.channelSlug = channel.slug;
      video.matched = true;
      break;
    }
  }
  if (video.channelSlug) {
    console.debug(
      "background.js: found youtube and nebula video in lookup table"
    );
    return video;
  }

  // Check each channels not matched videos
  for (let index = 0; index < lookupTable.channels.length; index++) {
    const channel = lookupTable.channels[index];
    if (channel.not_matched.includes(url)) {
      video.known = true;
      video.channelSlug = channel.slug;
      video.matched = false;
      break;
    }
  }
  if (video.channelSlug) {
    console.debug("background.js: youtube video found in lookup table");
    return video;
  }

  console.debug("background.js: youtube video not found in lookup table");
};
