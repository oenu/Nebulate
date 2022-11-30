// rechecks channel information from nebula and youtube, provides a summary of any changes

import { channelFromYoutube } from "../channel/register";
import { Channel } from "../models/channel/channel";

export const checkChannels = async () => {
  

  // Get all channels from mongodb
  const channels = await Channel.find({}).select("-nebulaVideos -youtubeVideos")

  // Loop through each channel
  for (const channel of channels) {
    // Get channel data from Nebula
    const 
   
    // Get channel data from Youtube
    const { upload_playlist_id, channelTitle, custom_url } = await channelFromYoutube(channel.youtubeId);



    // Compare Nebula and Youtube data
    if (nebulaChannel.length !== youtubeChannel.length) {
      console.log(
        `Channel ${channel.slug} has ${nebulaChannel.length} videos in Nebula and ${youtubeChannel.length} videos in Youtube`
      );
    }
  }
