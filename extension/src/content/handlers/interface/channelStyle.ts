// Adds styling to the active channel if it is on Nebula

import { CSS_IDS } from "../../../common/enums";
import { getOptions } from "../../../common/options";
import { Channel } from "../../../common/types";

// TODO: Add channel identifier to css selectors to avoid conflicts - requires updating all channels to have custom_url property in lookup table
export const addChannelStyle = async (channel: Channel): Promise<void> => {
  const options = await getOptions();

  if (!options.highlightChannel.value) {
    throw new Error("Options are set to not show on channel page");
  }

  if (!options.gradientStart.value) {
    console.warn("Gradient start color not set, using default");
    options.gradientStart.value = "rgb(62, 187, 243)";
  }

  if (!options.gradientEnd.value) {
    console.warn("Gradient end color not set, using default");
    options.gradientEnd.value = "rgb(88, 80, 209)";
  }

  // Wait for the channel box to load
  waitForChannelBox(10000)
    .catch(() => {
      throw new Error("Channel box failed to load");
    })
    .then(() => {
      console.debug(
        "addChannelStyle: adding channel style for channel: ",
        channel
      );
      const channelStyle = `div#owner 
      { transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
      box-shadow: -10px 0 20px ${options.gradientStart.value}, 10px 0 20px ${options.gradientEnd.value} !important; }`;
      // eslint-disable-next-line no-undef
      let channelStyleElement = document.getElementById(
        CSS_IDS.CHANNEL
        // eslint-disable-next-line no-undef
      ) as HTMLStyleElement;

      if (!channelStyleElement) {
        // eslint-disable-next-line no-undef
        channelStyleElement = document.createElement("style");
        channelStyleElement.id = CSS_IDS.CHANNEL;
        channelStyleElement.innerHTML = channelStyle;
        // eslint-disable-next-line no-undef
        document.head.appendChild(channelStyleElement);
      } else {
        channelStyleElement.innerHTML = channelStyle;
      }
    });
};

// Wait for the channel box to load
const waitForChannelBox = async (msDelay: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    if (document.querySelector("div#owner")) resolve();

    // eslint-disable-next-line no-undef
    const channelBoxObserver = new MutationObserver(() => {
      // eslint-disable-next-line no-undef
      const channelBox = document.querySelector("div#owner");
      if (channelBox) {
        channelBoxObserver.disconnect();
        console.timeEnd("Channel box loaded in");
        clearTimeout(timeout);
        resolve();
      }
    });

    // Check that the channel box is not already loaded
    // eslint-disable-next-line no-undef
    const channelBox = document.querySelector("div#owner");
    if (channelBox) resolve();

    // Set a timeout to 10 seconds
    const timeout = setTimeout(() => {
      console.log(`Timed out waiting ${msDelay}ms for channel box to load`);
      reject();
    }, msDelay);
    console.log(`Waiting ${msDelay}ms for channel box to load`);
    console.time("Channel box loaded in");
    // eslint-disable-next-line no-undef
    channelBoxObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
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
      channelStyleElement.remove();
    }
  }
};

export const checkChannelStyle = async (channel: Channel): Promise<boolean> => {
  try {
    console.debug(
      "checkChannelStyle: Checking if channel style exists and is valid for channel: ",
      channel
    );
    // eslint-disable-next-line no-undef
    const style = document.getElementById(CSS_IDS.CHANNEL);
    if (style) {
      console.debug("checkChannelStyle: Channel style exists");
      return Promise.resolve(true);
    } else {
      console.debug("checkChannelStyle: Channel style does not exist");
      return Promise.resolve(false);
    }
  } catch (error) {
    console.error("checkChannelStyle: " + error);
    return Promise.reject();
  }
};
