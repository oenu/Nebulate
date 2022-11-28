import { ChannelRedirectMessage, localChannel } from "../../content_script";
import { BUTTON_IDS, Messages } from "../../enums";

/**
 * AddChannelButton
 * 1. Check if the button already exists
 * 1.1 If it does, remove it and add a new one
 * 2. Create the button
 * 3. Add the click event listener
 * 4. Add the button to the page
 * 4.1 Wait for the subscribe button to load
 * 4.2 Add the button to the page
 */
export const addChannelButton = async (): Promise<void> => {
  try {
    console.debug("addChannelButton: Adding redirect button");

    // 1.
    // Check if button already exists
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.CHANNEL);
    if (button) {
      console.debug("addChannelButton: Button already exists");
      return Promise.resolve();
    }

    // 2.
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

    // 3.
    // Add the click event listener
    nebulate_logo.addEventListener("click", () => {
      console.debug("ChannelButton: Clicked");
      if (localChannel) {
        console.debug("addChannelButton: Redirecting to channel");
        const message: ChannelRedirectMessage = {
          type: Messages.CHANNEL_REDIRECT,
          channel: localChannel,
        };
        chrome.runtime.sendMessage(message);
      } else {
        console.error("addChannelButton: No channel found");
      }
    });

    // 4.
    // Add the button to the page

    // 4.1
    // Wait for the subscribe button to load
    // eslint-disable-next-line no-undef
    const waitForSubscribeButton = (): Promise<Element | null> => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          // eslint-disable-next-line no-undef
          const subscribeButton = document.querySelector(
            "#subscribe-button:not(.skeleton-bg-color)"
          );
          if (subscribeButton) {
            console.debug("addChannelButton: Subscribe button found");
            clearInterval(interval);
            console.log(subscribeButton);
            resolve(subscribeButton);
          } else {
            console.debug(
              "addChannelButton: Subscribe button not found, retrying"
            );
          }
        }, 1000);
      });
    };

    // eslint-disable-next-line no-undef
    const subscribeButton = await waitForSubscribeButton();
    // const subscribe_button = document.querySelector(
    //   "#subscribe-button:not(.skeleton-bg-color)"
    // );

    if (subscribeButton) {
      console.debug("addChannelButton: Adding button to DOM");
      subscribeButton.insertAdjacentElement("afterend", nebulate_logo);
    } else {
      console.warn("ChannelButton: No subscribe button found");
    }
  } catch (e) {
    console.error("addChannelButton: Error adding button", e);
    return Promise.reject();
  }
};

/**
 * RemoveChannelButton
 * 1. Check if the button exists
 * 2. Remove the click event listener (useful for older browsers)
 * 3. Remove the button from the page
 */
export const removeChannelButton = (): Promise<void> => {
  try {
    console.debug("removeChannelButton: Removing redirect button");

    // 1.
    // Check if button already exists
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.CHANNEL);
    if (!button) {
      console.debug("removeChannelButton: No button found");
      return Promise.resolve();
    }

    // 2.
    // Remove the click event listener
    button.removeEventListener("click", () => {
      console.debug("ChannelButton: Clicked");
      if (localChannel) {
        console.debug("removeChannelButton: Redirecting to channel");
        chrome.runtime.sendMessage({
          type: Messages.CHANNEL_REDIRECT,
          channel: localChannel,
        });
      } else {
        console.error("removeChannelButton: No channel found");
      }
    });

    // 3.
    // Remove the button from the DOM
    button.remove();

    return Promise.resolve();
  } catch (e) {
    console.error("removeChannelButton: Error removing button", e);
    return Promise.reject();
  }
};
