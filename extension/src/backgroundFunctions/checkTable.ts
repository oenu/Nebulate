// Check the local table for the given videoId

import { LookupTable } from "../parent_types";
import { Video } from "../types";

/**
 * Check the local table for the given urls / videoIds
 * 1. Get the lookup table
 * 2. Create promises for each videoId
 * 2.1 Extract the videoId from the url if needed
 * 2.2 Check if the videoId is valid
 * 2.3 Check if the videoId is in the matched videos table (shorter)
 * 2.4 Check if the videoId is in the unmatched videos table (longer)
 * 2.5 If the video is unknown and unmatched, return a basic video object
 * 3. Trigger the promises and wait for the results
 * 4. Return the results
 */

export const checkTable = async (urls: string[]): Promise<Video[]> => {
  try {
    // 1.
    // Get the lookup table
    const { lookupTable } = (await chrome.storage.local.get("lookupTable")) as {
      lookupTable: LookupTable;
    };
    if (!lookupTable) {
      throw new Error("CheckTable: lookup table not found");
    }

    // 2.
    // Create promises for each videoId
    const promises = urls.map(async (url) => {
      return new Promise<Video>((resolve) => {
        // 2.1
        // Check if the videoId / url is valid and extract the videoId if needed
        const videoId = url.includes("youtube.com")
          ? url.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0] ??
            ((): void => {
              throw new Error("CheckTable: invalid url");
            })()
          : url;

        // 2.2
        // Check if the videoId is valid
        if (!videoId)
          throw new Error(
            "CheckTable: could not extract video ID from URL " + url
          );

        if (videoId.length !== 11)
          throw new Error(
            "CheckTable: video ID " + videoId + " is not 11 characters long"
          );

        // 2.3
        // Check if the videoId is in the matched videos table (shorter)
        for (const channel of lookupTable.channels) {
          for (const matchedVideo of channel.matched) {
            if (videoId.includes(matchedVideo.id)) {
              const video: Video = {
                videoId,
                known: true,
                matched: true,
                channelSlug: channel.slug,
                channelId: channel.youtubeId,
                videoSlug: matchedVideo.slug,
              };
              // return video;
              resolve(video);
              return;
            }
          }
        }

        // 2.4
        // Check if the videoId is in the unmatched videos table (longer)
        for (const channel of lookupTable.channels) {
          for (const unmatchedVideo of channel.not_matched) {
            if (videoId.includes(unmatchedVideo)) {
              const video: Video = {
                videoId,
                known: true,
                matched: false,
                channelSlug: channel.slug,
                channelId: channel.youtubeId,
              };
              // return video;
              resolve(video);
              return;
            }
          }
        }
        // 2.5
        // If the video is unknown and unmatched, return a basic video object
        const video: Video = {
          videoId,
          known: false,
          matched: false,
        };
        resolve(video);
        return;
      });
    });

    // 3.
    // Trigger the promises
    const videoResults = await Promise.allSettled(promises);

    // Log the results
    const fulfilled = videoResults.filter(
      (result) => result.status === "fulfilled"
    );
    const rejected = videoResults.filter(
      (result) => result.status === "rejected"
    );

    console.debug(
      `CheckTable: Provided ${urls.length} urls, got ${videoResults.length} results, ${fulfilled.length} fulfilled, ${rejected.length} rejected`
    );

    // 4.
    // Return the results
    return videoResults.map((videoResult) => {
      if (videoResult.status === "fulfilled") {
        return videoResult.value;
      } else {
        throw videoResult.reason;
      }
    });
  } catch (error) {
    console.error("CheckTable: error", error);

    throw error;
  }
};
