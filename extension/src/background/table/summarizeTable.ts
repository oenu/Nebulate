import { LookupTable } from "../../common/parent_types";

export type TableSummary = {
  totalMatches: number; // Equal to the number of Nebula.app videos with youtube matches
  totalUnmatched: number; // Equal to the number of youtube videos without Nebula.app matches
  totalVideos: number; // Equal to the number of unmatched videos + matched videos
  totalChannels: number; // Equal to the number of unique channels
  channelMatchedVideos: {
    [key: string]: {
      numberOfMatchedVideos: number;
      numberOfUnmatchedVideos: number;
    };
  };
  generatedAt: Date;
  lastUpdated: Date;
  id: string;
};

/**
 * 1. Check if the table has been provided
 * 1.1 If it has not check if the table is in storage
 * 2. Check if the table is formatted correctly
 * 3. Summarize the table
 * 4. Return the summary
 */
export const summarizeTable = async (
  table?: LookupTable
): Promise<TableSummary> => {
  // 1.
  // Check if the table has been provided
  if (!table) {
    // 1.1
    // If it has not check if the table is in storage
    console.log("Summarize Table: Table not provided, using storage table");
    table = (await chrome.storage.local.get("lookupTable"))
      .lookupTable as LookupTable;
  }

  if (!table) {
    throw new Error("Summarize Table: No table provided or found in storage");
  }

  // 2.
  // Check if the table is formatted correctly
  const lastUpdate = await chrome.storage.local.get("lastUpdate");
  const lastUpdatedDate = new Date(lastUpdate.lastUpdate);

  const tableSummary: TableSummary = {
    totalMatches: 0,
    totalUnmatched: 0,
    totalVideos: 0,
    totalChannels: 0,
    channelMatchedVideos: {},
    generatedAt: table.generatedAt,
    lastUpdated: lastUpdatedDate,
    id: table.id,
  };

  // 3.
  // Summarize the table

  table.channels.forEach((channel) => {
    // Add channel to channelMatchedVideos
    tableSummary.channelMatchedVideos[channel.slug] = {
      numberOfMatchedVideos: 0,
      numberOfUnmatchedVideos: 0,
    };

    // Add channel to total channels
    tableSummary.totalChannels++;

    // Add matched videos to total matches
    tableSummary.totalMatches += channel.matched.length;

    // Add unmatched videos to total unmatched
    tableSummary.totalUnmatched += channel.not_matched.length;

    // Add matched videos to channel
    tableSummary.channelMatchedVideos[channel.slug].numberOfMatchedVideos +=
      channel.matched.length;

    // Add unmatched videos to channel
    tableSummary.channelMatchedVideos[channel.slug].numberOfUnmatchedVideos +=
      channel.not_matched.length;

    // Add matched videos to total videos
    tableSummary.totalVideos += channel.matched.length;

    // Add unmatched videos to total videos
    tableSummary.totalVideos += channel.not_matched.length;
  });

  // 4.
  // Return the summary
  console.log("Summarize Table: Table summarized");
  console.log(tableSummary);
  return tableSummary;
};
