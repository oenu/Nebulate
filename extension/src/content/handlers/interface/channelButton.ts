import { BUTTON_IDS, Messages } from "../../../common/enums";
import { Channel } from "../../../common/types";
import { ChannelRedirectMessage } from "../../../content_script";

export const addChannelButton = async (channel: Channel): Promise<void> => {
  try {
    console.debug("addChannelButton: Adding redirect button");

    // Check if button already exists
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.CHANNEL);
    if (button) {
      console.debug("addChannelButton: Button already exists, removing");
      await removeChannelButton();
    }

    // Create the button
    // eslint-disable-next-line no-undef
    const nebulate_logo = document.createElement("img");
    nebulate_logo.src = chrome.runtime.getURL("assets/icon.png");
    nebulate_logo.id = BUTTON_IDS.CHANNEL;
    nebulate_logo.style.cursor = "pointer";
    nebulate_logo.style.height = "36px";
    nebulate_logo.style.maxWidth = "100%";
    nebulate_logo.style.maxHeight = "100%";
    nebulate_logo.style.lineHeight = "36px";
    channel.slug &&
      nebulate_logo.setAttribute("data-nebula-channel-slug", channel.slug);

    // Add the click event listener
    nebulate_logo.addEventListener("click", () => {
      if (channel.slug) {
        console.debug("ChannelButton: redirecting to channel" + channel.slug);
        const message: ChannelRedirectMessage = {
          type: Messages.CHANNEL_REDIRECT,
          channel,
        };
        chrome.runtime.sendMessage(message);
      } else {
        console.error("addChannelButton: No channel found" + channel.slug);
      }
    });

    // Wait for the subscribe button to load (max 20 seconds)
    let subscribe_timeout = 20000;
    // eslint-disable-next-line no-undef
    const waitForSubscribeButton = (): Promise<Element | null> => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (subscribe_timeout <= 0) {
            clearInterval(interval);
            resolve(null);
          }
          // eslint-disable-next-line no-undef
          const subscribeButton = document.querySelector(
            "#subscribe-button:not(.skeleton-bg-color)"
          );
          if (subscribeButton) {
            resolve(subscribeButton);
            clearInterval(interval);
          } else {
            console.debug(
              "addChannelButton: Subscribe button not found, retrying"
            );
          }
          subscribe_timeout -= 200;
        }, 200);
      });
    };

    // eslint-disable-next-line no-undef
    const subscribeButton = await waitForSubscribeButton();

    if (!subscribeButton) {
      console.warn("ChannelButton: No subscribe button found");
      return Promise.reject();
    }

    // Make sure that no other nebulate buttons are present
    // eslint-disable-next-line no-undef
    const nebulateButtons = document.querySelectorAll(`#${BUTTON_IDS.CHANNEL}`);
    nebulateButtons.forEach((button) => {
      button.remove();
    });

    // console.debug("addChannelButton: Adding button to DOM");
    subscribeButton.insertAdjacentElement("afterend", nebulate_logo);
    // console.debug("addChannelButton: Button added to DOM");
    return Promise.resolve();
  } catch (error) {
    console.error("addChannelButton: " + error);
    return Promise.reject();
  }
};

export const removeChannelButton = (): Promise<void> => {
  try {
    console.debug("removeChannelButton: Removing redirect button");
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.CHANNEL);
    if (button) {
      button.remove();
    }
    return Promise.resolve();
  } catch (e) {
    console.error("removeChannelButton: Error removing button", e);
    return Promise.reject();
  }
};

export const checkChannelButton = async (
  channel: Channel
): Promise<boolean> => {
  try {
    console.debug(
      "checkChannelButton: Checking if button exists for given channel"
    );
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.CHANNEL);
    if (button) {
      const channelSlug = button.getAttribute("data-nebula-channel-slug");
      if (channelSlug === channel.slug) {
        console.debug(
          "checkChannelButton: Button exists and is correct: " + channel.slug
        );
        return Promise.resolve(true);
      } else {
        console.debug(
          "checkChannelButton: Button exists but is incorrect" + channel.slug
        );
        return Promise.resolve(false);
      }
    } else {
      console.debug(
        "checkChannelButton: Button does not exist for channel" + channel.slug
      );
      return Promise.resolve(false);
    }
  } catch (error) {
    console.error("checkChannelButton: " + error);
    return Promise.reject();
  }
};
