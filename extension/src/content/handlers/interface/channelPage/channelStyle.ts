// /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+\/featured|@[a-zA-Z0-9]+\/videos|@[a-zA-Z0-9]+|channel\/[a-zA-Z0-9]+|user\/[a-zA-Z0-9]+)$/
// Identify the channel page based on its custom url, if known then apply styling and a redirect button

import { checkChannel } from "../../../../common/checkChannel";
import { createStyledSvg } from "../../../../common/createStyledSvg";
import { BUTTON_IDS, CSS_IDS, Messages } from "../../../../common/enums";
import { getOptions, optionUtilityType } from "../../../../common/options";
import { Channel, ChannelRedirectMessage } from "../../../../common/types";

const waitForChannelBox = async (msDelay: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-undef
    if (document.querySelector("div#channel-header")) resolve();

    // eslint-disable-next-line no-undef
    const channelBoxObserver = new MutationObserver(() => {
      // eslint-disable-next-line no-undef
      const channelBox = document.querySelector("div#channel-header");
      if (channelBox) {
        channelBoxObserver.disconnect();
        console.timeEnd("Channel box loaded in");
        clearTimeout(timeout);
        resolve();
      }
    });

    // Check that the channel box is not already loaded
    // eslint-disable-next-line no-undef
    const channelBox = document.querySelector("div#channel-header");
    if (channelBox) resolve();

    // Set a timeout
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

export default async function channelPageStyle(url: string): Promise<void> {
  if (
    !url.match(
      // /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+\/featured|@[a-zA-Z0-9]+\/videos|@[a-zA-Z0-9]+|channel\/[a-zA-Z0-9]+|user\/[a-zA-Z0-9]+)$/
      /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+)(\/[a-zA-Z0-9]+)?$/
    ) &&
    !url.match(
      /^https:\/\/www\.youtube\.com\/channel\/[a-zA-Z0-9]+(\/[a-zA-Z0-9]+)?$/
    ) &&
    !url.match(
      /^https:\/\/www\.youtube\.com\/user\/[a-zA-Z0-9]+(\/[a-zA-Z0-9]+)?$/
    ) &&
    !url.match(
      /^https:\/\/www\.youtube\.com\/c\/[a-zA-Z0-9]+(\/[a-zA-Z0-9]+)?$/
    )
  ) {
    console.log("ChannelPageStyle: Not a channel page");
    removeChannelPageStyle();
    return;
  }

  // Check if the channel is known
  const channel = await checkChannel(url);
  if (!channel) {
    console.log("ChannelPageStyle: Channel not known");
    removeChannelPageStyle();
    return;
  } else {
    console.log("ChannelPageStyle: Channel known");
  }

  const options = await getOptions();

  if (!options.highlightChannel.value) {
    throw new Error(
      "ChannelPageStyle: Options are set to not show on channel page"
    );
  }

  if (!options.gradientStart.value) {
    console.warn(
      "ChannelPageStyle: Gradient start color not set, using default"
    );
    options.gradientStart.value = "rgb(62, 187, 243)";
  }

  if (!options.gradientEnd.value) {
    console.warn("ChannelPageStyle: Gradient end color not set, using default");
    options.gradientEnd.value = "rgb(88, 80, 209)";
  }

  // Wait for the channel box to load
  await waitForChannelBox(10000)
    .catch(() => {
      throw new Error("ChannelPageStyle: Channel box failed to load");
    })
    .then(() => {
      console.log("ChannelPageStyle: Channel box loaded");

      applyChannelPageStyle(channel, options);
    });
}

const applyChannelPageStyle = async (
  channel: Channel,
  options: optionUtilityType
): Promise<void> => {
  console.log("ApplyChannelPageStyle: Applying style");
  // eslint-disable-next-line no-undef
  const channelBox = document.querySelector("div#channel-header");
  if (!channelBox) {
    throw new Error("ChannelPageStyle: Channel box not found");
  }
  // Check if a style element already exists
  // eslint-disable-next-line no-undef
  const existingStyle = document.getElementById(
    CSS_IDS.CHANNEL_PAGE_STYLE
    // eslint-disable-next-line no-undef
  ) as HTMLStyleElement;

  // If the style element already exists, check if it is the same as the current style
  if (existingStyle) {
    if (
      existingStyle.getAttribute("nebulate-channel-page-custom-url") ===
      channel.custom_url
    ) {
      console.log("ChannelPageStyle: Style already applied");
      return;
    } else {
      console.log(
        "ChannelPageStyle: Style already applied, but for a different channel"
      );
      removeChannelPageStyle();
    }
  }

  // Create a new style element
  // eslint-disable-next-line no-undef
  const channelBoxStyle = document.createElement("style");
  channelBoxStyle.setAttribute(
    "nebulate-channel-page-custom-url",
    channel.custom_url as string
  );
  channelBoxStyle.id = CSS_IDS.CHANNEL_PAGE_STYLE;
  channelBoxStyle.innerHTML = `
        #channel-header #avatar {
         box-shadow: -10px 0 20px ${options.gradientStart.value}, 10px 0 20px ${options.gradientEnd.value} !important;
        }`;
  channelBox.appendChild(channelBoxStyle);

  // Add button to inner-header-container
  // eslint-disable-next-line no-undef
  const innerHeaderContainer = document.querySelector(
    "div#channel-header div#inner-header-container"
  );
  if (!innerHeaderContainer) {
    throw new Error("ChannelPageStyle: Inner header container not found");
  }
  // eslint-disable-next-line no-undef
  // Create the button
  const nebulate_svg = createStyledSvg(options.buttonColor.value as string);
  nebulate_svg.id = BUTTON_IDS.CHANNEL;
  nebulate_svg.style.cursor = "pointer";
  nebulate_svg.style.height = "45px";
  nebulate_svg.style.maxWidth = "100%";
  nebulate_svg.style.maxHeight = "100%";
  nebulate_svg.style.lineHeight = "45px";

  nebulate_svg.addEventListener("click", () => {
    // Check that the url is still the same

    if (channel.slug) {
      console.debug("ChannelPageStyle: redirecting to channel" + channel.slug);
      const message: ChannelRedirectMessage = {
        type: Messages.CHANNEL_REDIRECT,
        channel,
      };
      chrome.runtime.sendMessage(message);
    } else {
      console.error("ChannelPageStyle: No channel found" + channel.slug);
    }
  });

  innerHeaderContainer.appendChild(nebulate_svg);
};

const removeChannelPageStyle = (): void => {
  // eslint-disable-next-line no-undef
  const existingStyle = document.getElementById(
    CSS_IDS.CHANNEL_PAGE_STYLE
    // eslint-disable-next-line no-undef
  ) as HTMLStyleElement;
  if (existingStyle) {
    existingStyle.remove();
  }

  // eslint-disable-next-line no-undef
  const channelButton = document.getElementById(
    BUTTON_IDS.CHANNEL
    // eslint-disable-next-line no-undef
  ) as HTMLDivElement;
  if (channelButton) {
    channelButton.remove();
  }
};
