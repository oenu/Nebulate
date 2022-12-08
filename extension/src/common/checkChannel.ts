// Check the lookup table for the custom url of the channel

import { LookupTable } from "./parent_types";
import { Channel } from "./types";

export const checkChannel = async (
  channelUrl: string
): Promise<Channel | null> => {
  console.log("passed channelUrl: " + channelUrl);
  let channelID: string | undefined;
  // Detect if url is formatted @channel | @channel/featured etc
  const customUrl = channelUrl.match(
    /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+)(\/[a-zA-Z0-9]+)?$/
  )?.[1];

  console.log("checkChannel: customUrl: " + customUrl);

  if (customUrl) {
    console.log("checkChannel: customUrl found: " + customUrl);
  }

  // Detect if url is formatted youtube.com/channel/UC... | youtube.com/channel/UC.../featured etc
  if (!customUrl) {
    channelID = channelUrl.match(
      /^https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})(\/[a-zA-Z0-9]+?)?$/
    )?.[1];
    console.log("checkChannel: regex match for /channel/" + channelID);
  }
  // Detect if url is formatted youtube.com/c/channel | youtube.com/c/channel/featured etc
  if (!channelID && !customUrl) {
    channelID = channelUrl.match(
      /^https:\/\/www\.youtube\.com\/c\/([a-zA-Z0-9]+?)(\/[a-zA-Z0-9]+?)?$/
    )?.[0];
    console.log("checkChannel: regex match for /c/" + channelID);
  }
  if (!channelID && !customUrl) {
    throw new Error("checkChannel: channelID not found: " + channelUrl);
  }

  const table = (await chrome.storage.local.get("lookupTable"))
    .lookupTable as LookupTable;

  // Custom URl Handling
  // If the channelID is a custom url, check the lookup table for the custom url of the channel
  if (customUrl) {
    if (customUrl.startsWith("@")) {
      const lowercaseCustomUrl = customUrl.toLowerCase();
      const channel = table.channels.find(
        (channel) => channel.custom_url === lowercaseCustomUrl
      );

      if (!channel) {
        console.log("checkChannel: channel not found: " + channelID);
        return null;
      }

      return {
        known: true,
        slug: channel.slug,
        custom_url: channel.custom_url,
        id: channel.youtubeId,
      } as Channel;
    }
  }

  // If the channelID is not a custom url, check the lookup table for the channel
  const channel = table.channels.find(
    (channel) => channel.youtubeId === channelID
  );

  if (!channel) {
    console.log("checkChannel: channel not found: " + channelID);
    return null;
  }

  return {
    known: true,
    slug: channel.slug,
    custom_url: channel.custom_url,
    id: channel.youtubeId,
  } as Channel;
};
