import { createStyledSvg } from "../../../../common/createStyledSvg";
import { BUTTON_IDS, CSS_CLASSES, Messages } from "../../../../common/enums";
import { getOptions } from "../../../../common/options";
import { Video, VideoRedirectMessage } from "../../../../common/types";

export const addVideoButton = async (video: Video): Promise<void> => {
  try {
    const options = await getOptions();

    // Check if the channel button is enabled
    if (!options.addVideoButton.value) {
      console.debug("addVideoButton: Video button is disabled");
      return;
    }

    // Check if the button color is set
    if (!options.buttonColor.value) {
      console.debug("addVideoButton: Button color is not set, using default");
      options.buttonColor.value = "#3EBBF3";
    }

    console.debug("addVideoButton: Adding redirect button");

    // Check if button already exists
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.VIDEO);
    if (button) {
      console.debug("addVideoButton: Button already exists, removing");
      await removeVideoButton();
    }

    // Create the video button svg
    const nebulate_svg = createStyledSvg(options.buttonColor.value as string);
    nebulate_svg.style.cursor = "pointer";
    nebulate_svg.style.height = "40px";
    nebulate_svg.style.width = "40px";
    nebulate_svg.style.marginTop = "5px";
    nebulate_svg.style.marginBottom = "5px";

    // Wrap the svg in a div (for classes)
    // eslint-disable-next-line no-undef
    const nebulate_div = document.createElement("div");
    nebulate_div.appendChild(nebulate_svg);
    nebulate_div.id = BUTTON_IDS.VIDEO;
    nebulate_div.className = "ytp-button " + CSS_CLASSES.VIDEO_BUTTON;
    nebulate_div.style.width = "45px";
    nebulate_div.title = "View this video on Nebula";
    video.slug &&
      nebulate_div.setAttribute("data-nebula-video-slug", video.slug);

    // Get the location of the controls (so we can insert the button)
    const youtube_right_controls =
      // eslint-disable-next-line no-undef
      document.getElementsByClassName("ytp-right-controls")[0];
    if (!youtube_right_controls) {
      console.error("addVideoButton: No right controls found");
      return Promise.reject();
    }

    // Add the button to the page
    youtube_right_controls.prepend(nebulate_div);

    // Add the click event listener
    nebulate_div.addEventListener("click", () => {
      if (video.slug) {
        console.debug("VideoButton: redirecting to video" + video.slug);
        const message: VideoRedirectMessage = {
          type: Messages.VIDEO_REDIRECT,
          video,
        };
        chrome.runtime.sendMessage(message);
      } else {
        console.error("VideoButton: No video found " + video.slug);
      }
    });
    return Promise.resolve();
  } catch (e) {
    console.error("addVideoButton: Error adding button", e);
    return Promise.reject();
  }
};

export const removeVideoButton = async (): Promise<void> => {
  try {
    console.debug("removeVideoButton: Removing redirect button");
    // eslint-disable-next-line no-undef
    while (document.getElementById(BUTTON_IDS.VIDEO)) {
      // eslint-disable-next-line no-undef
      const button = document.getElementById(BUTTON_IDS.VIDEO);
      button && button.remove();
    }
    return Promise.resolve();
  } catch (e) {
    console.error("removeVideoButton: Error removing button", e);
    return Promise.reject();
  }
};

export const checkVideoButton = async (video: Video): Promise<boolean> => {
  try {
    console.debug(
      "checkVideoButton: Checking if button exists for given video"
    );
    // eslint-disable-next-line no-undef
    const button = document.getElementById(BUTTON_IDS.VIDEO);
    if (button) {
      const videoSlug = button.getAttribute("data-nebula-video-slug");
      if (videoSlug === video.slug) {
        console.debug(
          "checkVideoButton: Button exists and is correct: " + video.slug
        );
        return Promise.resolve(true);
      } else {
        console.debug(
          "checkVideoButton: Button exists but is incorrect" + video.slug
        );
        return Promise.resolve(false);
      }
    } else {
      console.debug(
        "checkVideoButton: Button does not exist for video" + video.slug
      );
      return Promise.resolve(false);
    }
  } catch (error) {
    console.error("checkVideoButton: " + error);
    return Promise.reject();
  }
};
