// Check the local table for the given videoId

import { LookupTable } from "../parent_types";
import { Video } from "../types";

export const checkTable = async (url: string): Promise<Video | void> => {
  try {
    console.log("CheckTable: checking lookup table for video");

    // Check matched videos (shorter set)
    const { lookupTable } = (await chrome.storage.local.get("lookupTable")) as {
      lookupTable: LookupTable;
    };

    // Check if the lookup table exists
    if (!lookupTable) {
      console.warn("CheckTable: lookup table not found");
      return;
    }

    // Extract only the video ID using regex /(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/
    const videoId = url.match(
      // /(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/
      /(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/
    )?.[0];

    console.log("CheckTable: videoId", videoId);

    // Check if the video ID exists
    if (!videoId) {
      console.debug(`CheckTable: could not extract video ID from URL ${url}`);
      return;
    }

    // Structure the video object
    const video: Video = {
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
          console.debug("CheckTable: video is known and matched");
          return video;
        } else {
          video.matched = false;
        }
      }
    }

    console.debug("CheckTable: video is not matched");

    // Check unmatched videos (longer set)
    for (const channel of lookupTable.channels) {
      for (const unmatchedVideo of channel.not_matched) {
        if (videoId.includes(unmatchedVideo)) {
          video.known = true;
          video.matched = false;
          video.channelSlug = channel.slug;
          console.debug("CheckTable: video is known but not matched");
          return video;
        } else {
          video.known = false;
        }
      }
    }

    return video;
  } catch (error) {
    console.error(error);
  }
};
