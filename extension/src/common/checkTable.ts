// Check the local table for the given videoId

import { LookupTable } from "./parent_types";
import { Video } from "./types";

// Check a lookup table for a videoId or array of videoIds
export const checkTable = async ({
  urls,
  inputTable,
  checkKnown,
}: {
  urls: string[];
  inputTable?: LookupTable;
  checkKnown?: boolean;
}): Promise<Video[]> => {
  if (checkKnown === undefined) {
    checkKnown = false;
  }

  try {
    let lookupTable: LookupTable;

    // Get the lookup table
    if (!inputTable) {
      console.warn(
        "No lookup table provided to checkTable, this adds a lot of overhead, fetching table..."
      );
      const table = (await chrome.storage.local.get("lookupTable"))
        .lookupTable as LookupTable;

      if (!table) {
        throw new Error("CheckTable: lookup table not found");
      } else {
        lookupTable = table;
      }
    } else {
      lookupTable = inputTable;
    }

    if (!lookupTable || lookupTable === undefined) {
      throw new Error("CheckTable: lookup table not found");
    }

    // Create promises for each videoId
    const promises = urls.map(async (url) => {
      return new Promise<Video>((resolve, reject) => {
        // Check if the videoId / url is valid and extract the videoId if needed
        const videoId = url.includes("youtube.com")
          ? url.match(/(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/)?.[0] ??
            ((): void => {
              reject("CheckTable: Invalid url");
            })()
          : url;

        // Check if the videoId is valid
        if (!videoId)
          return reject(
            "CheckTable: Invalid videoId or url" + videoId + " " + url
          );
        if (videoId.length !== 11)
          return reject(
            "CheckTable: video ID " + videoId + " is not 11 characters long"
          );

        // Check if the videoId is in the matched videos table (shorter)
        for (const channel of lookupTable.channels) {
          for (const matchedVideo of channel.matched) {
            if (videoId.includes(matchedVideo.id)) {
              const video: Video = {
                videoId,
                known: true,
                matched: true,
                slug: matchedVideo.slug,
                channel: {
                  id: channel.youtubeId,
                  slug: channel.slug,
                  known: true,
                  custom_url: channel.custom_url,
                },
              };
              // matchedCount++;
              return resolve(video);
            }
          }
        }

        // Check if the videoId is in the unmatched videos table (longer)
        if (checkKnown) {
          for (const channel of lookupTable.channels) {
            for (const unmatchedVideo of channel.not_matched) {
              if (videoId.includes(unmatchedVideo)) {
                const video: Video = {
                  videoId,
                  known: true,
                  matched: false,
                  slug: undefined,
                  channel: {
                    id: channel.youtubeId,
                    slug: channel.slug,
                    known: true,
                    custom_url: channel.custom_url,
                  },
                };

                return resolve(video);
              }
            }
          }
        }

        // If the video is unknown and unmatched, return a basic video object
        const video: Video = {
          videoId,
          known: false,
          matched: false,
          slug: undefined,
          channel: {
            id: undefined,
            slug: undefined,
            known: false,
            custom_url: undefined,
          },
        };
        return resolve(video);
      });
    });

    // Trigger the promises
    const videoResults = await Promise.allSettled(promises);

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
