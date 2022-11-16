// Check the local table for the given videoId
import { Video } from "../enums";
import { LookupTable } from "../types";

export const checkTable = async (videoId: string) => {
  console.log("background.js: checking lookup table for video");

  // Check matched videos (shorter set)
  const { lookupTable } = (await chrome.storage.local.get("lookupTable")) as {
    lookupTable: LookupTable;
  };

  let video: Video = {
    // Default to not known
    videoId,
    known: false,
    matched: false,
  };

  // Check each channels matched videos (shorter set)
  for (const channel of lookupTable.channels) {
    for (const matchedVideo of channel.matched) {
      if (videoId.includes(matchedVideo.id)) {
        video.known = true;
        video.matched = true;
        video.videoSlug = matchedVideo.slug;
        video.channelSlug = channel.slug;
        console.debug("background.js: video is known and matched");
        return video;
      } else {
        video.matched = false;
      }
    }
  }

  console.debug("background.js: video is not matched");

  // Check unmatched videos (longer set)
  for (const channel of lookupTable.channels) {
    for (const unmatchedVideo of channel.not_matched) {
      if (videoId.includes(unmatchedVideo)) {
        video.known = true;
        video.matched = false;
        video.channelSlug = channel.slug;
        console.debug("background.js: video is known but not matched");
        return video;
      } else {
        video.known = false;
      }
    }
  }

  return video;
};
