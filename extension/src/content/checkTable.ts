// Check the local table for the given videoId

import { LookupTable } from "../common/parent_types";
import { Video } from "../common/types";

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
    let matchedCount = 0;
    let knownCount = 0;
    let unknownCount = 0;

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
      return new Promise<Video>((resolve, reject) => {
        // 2.1
        // Check if the videoId / url is valid and extract the videoId if needed
        const videoId = url.includes("youtube.com")
          ? url.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0] ??
            ((): void => {
              reject("CheckTable: Invalid url");
            })()
          : url;

        // 2.2
        // Check if the videoId is valid
        if (!videoId)
          return reject(
            "CheckTable: Invalid videoId or url" + videoId + " " + url
          );
        if (videoId.length !== 11)
          return reject(
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
              matchedCount++;
              return resolve(video);
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
              knownCount++;
              return resolve(video);
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
        unknownCount++;
        return resolve(video);
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
      `CheckTable: Provided with ${urls.length} urls, ${fulfilled.length} fulfilled | ${matchedCount} matched, ${knownCount} known, ${unknownCount} unknown, ${rejected.length} rejected`
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
