// Check the lookup table for the custom url of the channel

import { LookupTable } from "./parent_types";
import { Channel } from "./types";

export const checkChannel = async (channelID: string): Promise<Channel> => {
  const lowerCase = channelID.toLowerCase();

  if (!lowerCase.startsWith("@")) {
    throw new Error(
      "CheckTable: channelID does not start with @: " + channelID
    );
  }

  // Get lookup table
  const table = (await chrome.storage.local.get("lookupTable"))
    .lookupTable as LookupTable;
  if (!table) {
    throw new Error("CheckTable: lookup table not found");
  }

  // Check the lookup table for the custom url of the channel
  const channel = table.channels.find(
    (channel) => channel.custom_url === lowerCase
  );

  if (!channel) {
    throw new Error("CheckTable: channel not found");
  }

  return {
    known: true,
    slug: channel.slug,
    custom_url: channel.custom_url,
    id: channel.youtubeId,
  } as Channel;
};
