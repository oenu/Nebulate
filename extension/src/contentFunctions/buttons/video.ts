import { VideoRedirectMessage } from "../../content_script";
import { BUTTON_IDS, CSS_CLASSES, Messages } from "../../enums";
import { getLocalPage } from "../page/update";

/**
 * AddVideoButton
 * 1. Check if the button already exists
 * 1.1 If it does, remove it and add a new one
 * 2. Create the button
 * 3. Add the button to the page
 * 4. Add the click event listener
 */
export const addVideoButton = (): Promise<void> => {
  try {
    console.debug("addVideoButton: Adding redirect button");

    // 1.
    // Check if button already exists
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.VIDEO);
    if (button) {
      console.debug("addVideoButton: Button already exists");

      // 1.1
      button.remove();
    }

    // 2.
    // Create the button
    // eslint-disable-next-line no-undef
    const nebulate_button = document.createElement("img");
    nebulate_button.src = chrome.runtime.getURL("assets/icon.png");
    nebulate_button.className = "ytp-button " + CSS_CLASSES.VIDEO_BUTTON;
    nebulate_button.id = BUTTON_IDS.VIDEO;
    nebulate_button.title = "View this video on Nebula";
    const youtube_right_controls =
      // eslint-disable-next-line no-undef
      document.getElementsByClassName("ytp-right-controls")[0];
    if (!youtube_right_controls) {
      console.error("addVideoButton: No right controls found");
      return Promise.reject();
    }

    // 3.
    // Add the button to the page
    youtube_right_controls.prepend(nebulate_button);

    // 4.
    // Add the click event listener
    nebulate_button.addEventListener("click", () => {
      getLocalPage().then((page) => {
        console.debug("VideoButton: Clicked");
        if (page.video) {
          const message: VideoRedirectMessage = {
            type: Messages.VIDEO_REDIRECT,
            video: page.video,
          };
          chrome.runtime.sendMessage(message);
        } else {
          console.error("VideoButton: No video found");
        }
      });
    });
    return Promise.resolve();
  } catch (e) {
    console.error("addVideoButton: Error adding button", e);
    return Promise.reject();
  }
};

/**
 * RemoveVideoButton
 * 1. Check if the button exists
 * 2. Remove the click event listener (useful for older browsers)
 * 3. Remove the button from the page
 */
export const removeVideoButton = (): Promise<void> => {
  try {
    console.debug("removeVideoButton: Removing redirect button");

    // 1.
    // Check if button already exists
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.VIDEO);
    if (!button) {
      console.debug("removeVideoButton: No button found");
      return Promise.resolve();
    }

    // 2.
    // Remove the click event listener
    button.removeEventListener("click", () => {
      getLocalPage().then((page) => {
        console.debug("VideoButton: Clicked");
        if (page.video) {
          chrome.runtime.sendMessage({
            type: Messages.VIDEO_REDIRECT,
            video: page.video,
          });
        } else {
          console.error("VideoButton: No video found");
        }
      });
    });

    // 3.
    // Remove the button from the DOM
    button.remove();

    return Promise.resolve();
  } catch (e) {
    console.error("removeVideoButton: Error removing button", e);
    return Promise.reject();
  }
};
