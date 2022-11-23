import { BUTTON_IDS, CSS_CLASSES, CSS_IDS, Messages } from "./enums";
import { Channel, Video } from "./types";

console.debug("CS: init");
// // Runs in the context of the youtube tab

// Local Variables:
let localChannel: Channel | undefined;
let localVideo: Video | undefined;

// Local Message Types
export type VideoRedirectMessage = {
  type: Messages.VIDEO_REDIRECT;
  video: Video;
};

export type ChannelRedirectMessage = {
  type: Messages.CHANNEL_REDIRECT;
  channel: Channel;
};

/**
 * Handle Messages from the background script
 * 1. Handle a clear message
 *  1.1 Remove the channel button and styling
 *  1.2 Remove the video button and styling
 * 2. Handle an add channel button message
 *  2.1 Add the channel button
 *  2.2 Add the channel styling
 * 3. Handle a remove channel button message
 *  3.1 Remove the channel button
 *  3.2 Remove the channel styling
 * 4. Handle an add video button message
 *  4.1 Add the video button
 *  4.2 Add the video styling
 * 5. Handle a remove video button message
 *  5.1 Remove the video button
 *  5.2 Remove the video styling
 */
chrome.runtime.onMessage.addListener((message) => {
  try {
    console.debug("CS: message received", message);
    switch (message.type) {
      // 1.
      // Handle a clear message
      case Messages.CLEAR:
        console.debug("CS: clear");

        // 1.1
        // Remove the channel button and styling
        removeChannelButton();
        removeChannelCSS();

        // 1.2
        // Remove the video button and styling
        removeVideoButton();
        removeVideoCSS();
        break;

      // 2.
      // Handle an add channel button message
      case Messages.ADD_CHANNEL_BUTTON:
        {
          console.debug("CS: add channel button");
          const { channel } = message;
          if (!channel) {
            console.error("CS: Add_Channel_Button: no channel provided");
            return;
          }
          localChannel = channel;

          // 2.1
          // Add the channel button
          addChannelButton();

          // 2.2
          // Add the channel styling
          addChannelCSS();
        }
        break;

      // 3.
      // Handle a remove channel button message
      case Messages.REMOVE_CHANNEL_BUTTON: {
        console.debug("CS: remove channel button");

        // 3.1
        // Remove the channel button
        removeChannelButton();

        // 3.2
        // Remove the channel styling
        removeChannelCSS();
        localChannel = undefined;
        break;
      }

      // 4.
      // Handle an add video button message
      case Messages.ADD_VIDEO_BUTTON: {
        console.debug("CS: add video button");
        const { video } = message;
        if (!video) {
          console.error("CS: Add_Video_Button: no video provided");
          return;
        }
        localVideo = video;

        // 4.1
        // Add the video button
        addVideoButton();

        // 4.2
        // Add the video styling
        addVideoCSS();
        break;
      }

      // 5.
      // Handle a remove video button message
      case Messages.REMOVE_VIDEO_BUTTON: {
        console.debug("CS: remove video button");

        // 5.1
        // Remove the video button
        removeVideoButton();

        // 5.2
        // Remove the video styling
        removeVideoCSS();
        localVideo = undefined;
        break;
      }
      default:
        console.debug("CS: unknown message");
        break;
    }
  } catch (e) {
    console.error("CS: error handling message", e);
  }
});

// ========================= Channel Methods =========================
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
const addChannelButton = async (): Promise<void> => {
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
const removeChannelButton = (): Promise<void> => {
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

/**
 * Add Channel Styling
 * 1. Create the style element
 * 1.1 Set the id
 * 1.2 Add a glow to the channel box
 * 2. Add the style to the page
 */
const addChannelCSS = (): Promise<void> => {
  // 1.
  // Create the style element
  // eslint-disable-next-line no-undef
  const style = document.createElement("style");
  // 1.1
  // Set the id
  style.id = CSS_IDS.CHANNEL;
  // 1.2
  // Add a glow to the channel box
  style.innerHTML = `
  #owner {
    transition-delay: 0.5s;
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    box-shadow: -10px 0 20px rgb(62, 187, 243), 10px 0 20px rgb(88, 80, 209);
  }

#${BUTTON_IDS.CHANNEL} {
  max-height: 100%;
  height: 36px;
  max-width: 100%;
  line-height: 36px;
  /* Indicate that the button is clickable */
  cursor: pointer;
}

#${BUTTON_IDS.CHANNEL}:hover {
  /* Indicate that the button is clickable */
  cursor: pointer;
  color: rgb(255, 255, 255);
}`;

  // 2.
  // Add the style to the page
  // eslint-disable-next-line no-undef
  document.head.appendChild(style);

  return Promise.resolve();
};

/**
 * Remove Channel Styling
 * 1. Get the style element
 * 2. Remove the style element
 */
const removeChannelCSS = (): Promise<void> => {
  // 1.
  // Get the style element
  // eslint-disable-next-line no-undef
  const style = document.getElementById(CSS_IDS.CHANNEL);
  if (style) {
    // 2.
    // Remove the style element
    style.remove();
  }

  return Promise.resolve();
};

// ========================= Video Methods =========================
/**
 * AddVideoButton
 * 1. Check if the button already exists
 * 1.1 If it does, remove it and add a new one
 * 2. Create the button
 * 3. Add the button to the page
 * 4. Add the click event listener
 */
const addVideoButton = (): Promise<void> => {
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
      console.debug("VideoButton: Clicked");
      if (localVideo) {
        const message: VideoRedirectMessage = {
          type: Messages.VIDEO_REDIRECT,
          video: localVideo,
        };
        chrome.runtime.sendMessage(message);
      } else {
        console.error("VideoButton: No video found");
      }
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
const removeVideoButton = (): Promise<void> => {
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
      console.debug("VideoButton: Clicked");
      if (localVideo) {
        chrome.runtime.sendMessage({
          type: Messages.VIDEO_REDIRECT,
          video: localVideo,
        });
      } else {
        console.error("VideoButton: No video found");
      }
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

/**
 * AddVideoCSS
 * 1. Create the style element
 * 1.1 Set the id
 * 1.2 Add a glow to the video box
 * 2. Add the style to the page
 */
const addVideoCSS = (): Promise<void> => {
  // 1.
  // Create the style element
  // eslint-disable-next-line no-undef
  const style = document.createElement("style");
  // 1.1
  // Set the id
  style.id = CSS_IDS.VIDEO;
  // 1.2
  // Add a glow to the video box
  style.innerHTML = `#player {
  transition-delay: 0.5s;
  transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
}

#movie_player > div.html5-video-container > video {
  transition-delay: 0.5s;
  transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: -10px 0 10vw rgb(62, 187, 243), 10px 0 10vw rgb(88, 80, 209);
  clip-path: inset(0px -100vw 0px -100vw);
}`;

  // 2.
  // Add the style to the page
  // eslint-disable-next-line no-undef
  document.head.appendChild(style);

  return Promise.resolve();
};

/**
 * RemoveVideoCSS
 * 1. Get the style element
 * 2. Remove the style element
 */
const removeVideoCSS = (): Promise<void> => {
  // 1.
  // Get the style element
  // eslint-disable-next-line no-undef
  const style = document.getElementById(CSS_IDS.VIDEO);
  if (style) {
    // 2.
    // Remove the style element
    style.remove();
  }

  return Promise.resolve();
};
