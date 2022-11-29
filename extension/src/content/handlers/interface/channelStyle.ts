// Adds styling to the active channel if it is on Nebula

import { CSS_IDS } from "../../../common/enums";
import { Channel } from "../../../common/types";

// TODO: Add channel identifier to css selectors to avoid conflicts - requires updating all channels to have custom_url property in lookup table
export const addChannelStyle = async (channel: Channel): Promise<void> => {
  console.debug("addChannelStyle: adding channel style for channel: ", channel);
  const channelStyle = `div#owner 
      { transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
      box-shadow: -10px 0 20px rgb(62, 187, 243), 10px 0 20px rgb(88, 80, 209); }`;
  // eslint-disable-next-line no-undef
  let channelStyleElement = document.getElementById(
    CSS_IDS.CHANNEL
    // eslint-disable-next-line no-undef
  ) as HTMLStyleElement;

  if (!channelStyleElement) {
    // eslint-disable-next-line no-undef
    channelStyleElement = document.createElement("style");
    channelStyleElement.id = CSS_IDS.CHANNEL;
    // eslint-disable-next-line no-undef
    document.head.appendChild(channelStyleElement);
  } else {
    channelStyleElement.innerHTML = channelStyle;
  }
};

// Removes styling from the active channel if it is not on Nebula
export const removeChannelStyle = async (): Promise<void> => {
  // eslint-disable-next-line no-undef
  while (document.getElementById(CSS_IDS.CHANNEL)) {
    // eslint-disable-next-line no-undef
    const channelStyleElement = document.getElementById(
      CSS_IDS.CHANNEL
      // eslint-disable-next-line no-undef
    ) as HTMLStyleElement;

    if (channelStyleElement) {
      channelStyleElement.innerHTML = "";
    }
  }
};
