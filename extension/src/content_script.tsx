import { BUTTON_IDS, CSS_CLASSES, CSS_IDS, Messages } from "./enums";
import { Channel, Video } from "./types";

console.debug("CS: init");
// // Runs in the context of the youtube tab

// Local Variables:
let localChannel: Channel | undefined; // The nebula channel that matches the current url
let localVideo: Video | undefined; // The nebula video that matches the current url
let pageIntervalId: number; // The id of the interval that checks for new videos on the page
// eslint-disable-next-line no-undef
let styleElement: HTMLStyleElement | undefined; // The style element that is used to highlight videos on the page

// Local Video Cache:
let pageVideos: {
  // A cache of video links/thumbnails on the page and their corresponding nebula video
  [exactHref: exactHref]: VideoWithExactHref;
};

// Local Message Types
export type exactHref = string; // The href as it appears in the href attribute of the <a> tag - /watch?v=${videoId} or /watch?v=${videoId}&otherStuff

export type VideoWithExactHref = {
  // Used to store videos in the pageVideos object
  video: Video;
  exactHref: exactHref;
};

export type VideoIDWithExactHref = {
  // Used to pass between functions without losing the exact href
  videoId: string;
  exactHref: exactHref;
};

export type VideoRedirectMessage = {
  // Sent from the content script to the background script to redirect the user to a video
  type: Messages.VIDEO_REDIRECT;
  video: Video;
};

export type ChannelRedirectMessage = {
  // Sent from the content script to the background script to redirect the user to a channel
  type: Messages.CHANNEL_REDIRECT;
  channel: Channel;
};

export type CheckVideoMessage = {
  // Sent from the content script to the background script to check if a video or array of videos exist on nebula
  type: Messages.CHECK_VIDEO;
  url: string[];
};

export type CheckVideoMessageResponse = {
  // Sent from the background script to the content script in response to a CheckVideoMessage
  type: Messages.CHECK_VIDEO_RESPONSE;
  videos: Video[] | undefined;
};

export type UrlUpdateMessage = {
  // Sent from the background script to the content script when the page url changes
  type: Messages.URL_UPDATE;
  url: string;
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
 * 6. Pass to url update handler
 
 */
chrome.runtime.onMessage.addListener(async (message) => {
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

      // 6.
      // Handle a url change message
      case Messages.URL_UPDATE: {
        console.debug("CS: url update");
        const { url } = message;
        if (!url) {
          console.error("CS: Url_Update: no url provided");
          return;
        }
        urlUpdateHandler(url);
        break;
      }
    }
  } catch (error) {
    console.error("CS: error", error);
  }
});

// ========================= Page Load Methods =========================
/**
 * HandleNewVideos: Match videos, update pageVideos, trigger style updates
 * 1. Pass the video ids to the background script
 * 2. Handle the response
 * 2.1 Add href's to the videos
 * 2.2 Update the pageVideos object
 * 3. Use styleUpdater to update the styling for all videos in the pageVideos object
 */
const handleNewVideos = async (
  newVideos: VideoIDWithExactHref[]
): Promise<void> => {
  // 1.
  // Pass the video ids to the background script
  const message: CheckVideoMessage = {
    type: Messages.CHECK_VIDEO,
    url: newVideos.map((video) => video.videoId),
  };
  chrome.runtime.sendMessage(message, (response) => {
    // 2.
    // Handle the response
    console.debug("handleNewVideos: CheckVideoMessage response", response);
    if (response) {
      const { videos, type } = response as CheckVideoMessageResponse;
      if (type !== Messages.CHECK_VIDEO_RESPONSE)
        throw new Error("CS: handleNewVideos: invalid response type");

      if (videos) {
        // 2.1
        // Add href's to the videos
        const checkedVideosWithExactHref = videos.map((v) => {
          const exactHref = newVideos.find(
            (nv) => nv.videoId === v.videoId
          )?.exactHref;
          if (!exactHref)
            throw new Error("CS: handleNewVideos: exactHref not found");
          return { video: v, exactHref };
        });

        // 2.2
        // Update the pageVideos object
        console.debug("CS: handleNewVideos: updating pageVideos");
        checkedVideosWithExactHref.forEach((v) => {
          pageVideos[v.exactHref] = {
            video: v.video,
            exactHref: v.exactHref,
          };
        });

        // 3.
        // Use styleUpdater to update the styling for all videos in the pageVideos object
        styleUpdater(
          Object.values(pageVideos).map((v) => {
            return { video: v.video, exactHref: v.exactHref };
          })
        );
      }
    }
  });
};

/**
 * styleUpdater: Create a style element and add it to the page with selectors for every video in the pageVideos object
 * 1. Create a style element if it doesn't exist
 * 1.1 Check the DOM for a style element, if it already exists, use that
 * 2. Create a selector for each videoId in the pageVideos object (use *= matching) (remove duplicates)
 * 2.1 If the video is matched (from a channel on nebula, and has a matching video on nebula) add to the matched selector
 * 2.2 If the video is known (is from a channel that is on nebula) add to the known selector
 * 2.3 If the video is unknown (is not from a channel that is on nebula) do nothing
 * 3. Add the selectors to the style element
 * 3.1 Matched Videos
 * Note: known selector (if option for known highlighting is enabled) also includes matched videos
 * 3.1.1 Add matched video styling - glow and add a nebulate icon in the top left corner
 * 3.2 Known Videos
 * 3.2.1 Combine Known video selectors
 * 3.2.1 Add known video styling - glow effect around the video card/div
 * Note: Known videos should have a glow effect, matched videos should have a glow effect
 * 4. Add the style element to the page
 * Note: we cant use ids because they are not unique (thanks google)
 * Note: videoId's are in the form of /watch?v=${videoId} or /watch?v=${videoId}&otherStuff or others
 */
const styleUpdater = async (
  videos: VideoWithExactHref[],
  options: {
    // Known
    highlightKnown?: boolean; // Whether to highlight known videos
    knownColor?: string; // The color to use for known videos

    // Matched
    highlightMatched?: boolean; // Whether to highlight matched videos
    matchedColor?: string; // The color to use for matched videos

    // Matched Icon
    showMatchedIcon?: boolean; // Whether to show the nebulate icon on matched videos
    matchedIcon?: string; // The icon to use for matched videos
    matchedIconSize?: number; // The size of the icon to use for matched videos (in percentage height of the video thumbnail)
    matchedIconPosition?: "tl" | "tr" | "bl" | "br"; // The position of the icon to use for matched videos
    matchedIconColor?: string; // The hex color of the icon to use for matched videos
  } = {
    highlightKnown: true,
    knownColor: "#AFE1AF", // Celadon
    highlightMatched: true,
    matchedColor: " #FFD700", // Gold
    matchedIcon: "https://via.placeholder.com/50",
    matchedIconSize: 20,
    matchedIconPosition: "tl",
    matchedIconColor: "#000000",
  }
): Promise<void> => {
  console.time("CS: styleUpdater");

  // 1.
  // Create a style element if it doesn't exist
  if (!styleElement) {
    // 1.1
    // Check the DOM for a style element, if it already exists, use that
    // eslint-disable-next-line no-undef
    styleElement = document.querySelector(
      `#${CSS_IDS.BULK_VIDEO}`
      // eslint-disable-next-line no-undef
    ) as HTMLStyleElement;
    if (!styleElement) {
      // eslint-disable-next-line no-undef
      styleElement = document.createElement("style");
      styleElement.id = CSS_IDS.BULK_VIDEO;
      // eslint-disable-next-line no-undef
      document.head.append(styleElement);
    }
  }

  // 2.
  // Create a selector for each videoId in the pageVideos object (use *= matching) (remove duplicates)
  const knownSelectors: string[] = [];
  const matchedSelectors: string[] = [];
  const knownVideoIds = new Set<string>();
  const matchedVideoIds = new Set<string>();
  const matchedVideoIdsWithExactHref = new Set<string>();
  videos.forEach((video) => {
    const { video: v, exactHref } = video;

    // 2.1
    // If the video is matched (from a channel on nebula, and has a matching video on nebula) add to the matched selector
    if (v.matched) {
      matchedSelectors.push(`a[href*="${exactHref}"]`);
      matchedVideoIds.add(v.videoId);
      matchedVideoIdsWithExactHref.add(exactHref);
    }

    // 2.2
    // If the video is known (is from a channel that is on nebula) add to the known selector
    if (v.known) {
      knownSelectors.push(`a[href*="${exactHref}"]`);
      knownVideoIds.add(v.videoId);
    }

    // 2.3
    // If the video is unknown (is not from a channel that is on nebula) do nothing
  });

  // 3.
  // Add the selectors to the style element
  const styleText: string[] = [];

  // 3.1
  // Matched Videos
  if (options.highlightMatched && matchedSelectors.length > 0) {
    // Note: known selector (if option for known highlighting is enabled) also includes matched videos
    // 3.1.1
    // Add matched video styling - glow and add a nebulate icon in the top left corner
    styleText.push(`
      ${matchedSelectors.join(",")} {
        ${
          options.showMatchedIcon
            ? `background-image: url(${options.matchedIcon});`
            : ""
        }
        ${
          options.showMatchedIcon
            ? `background-position: ${options.matchedIconPosition};`
            : ""
        }
        ${options.showMatchedIcon ? `background-repeat: no-repeat;` : ""}
        ${
          options.showMatchedIcon
            ? `background-size: ${options.matchedIconSize}%;`
            : ""
        }
        ${
          options.showMatchedIcon
            ? `background-color: ${options.matchedIconColor};`
            : ""
        }
        box-shadow: 0 0 5px ${options.matchedColor};
      }
    `);
  }

  // 3.2
  // Known Videos
  if (options.highlightKnown && knownSelectors.length > 0) {
    // 3.2.1
    // Add known video styling - glow effect around the video card/div
    styleText.push(`
      ${knownSelectors.join(",")} {
        box-shadow: 0 0 5px ${options.knownColor};
      }
    `);
  }

  // 4.
  // Add the style element to the page
  styleElement.innerHTML = styleText.join("");

  // Note: we cant use ids because they are not unique (thanks google)
  // Note: videoId's are in the form of /watch?v=${videoId} or /watch?v=${videoId}&otherStuff or others
  console.timeEnd("CS: styleUpdater");
  return;
};

/**
 * Handle a new url being loaded
 * This should find all the links on the page that are known or matched videos and highlight them using css
 * 1. Clear the pageVideos cache
 * 2. Check for new videos using newVideosFromPage after 2 seconds (to allow the page to load)
 * 3. Pass the new videos to handleNewVideos
 * 4. Check for new videos every 10 seconds (to handle infinite scroll)
 */
const urlUpdateHandler = async (url: string): Promise<void> => {
  console.debug("urlUpdateHandler: url update handler", url);

  // 1.
  // Clear the pageVideos cache
  pageVideos = {};

  // 2.
  // Check for new videos using newVideosFromPage after 2 seconds
  const newVideos = await new Promise<VideoIDWithExactHref[]>((resolve) => {
    setTimeout(() => {
      resolve(newVideosFromPage());
    }, 2000);
  });

  // 3.
  // Pass the new videos to handleNewVideos
  console.debug("urlUpdateHandler: Passing new videos to HandleNewVideos");
  await handleNewVideos(newVideos);

  // 4.
  // Check for new videos every 10 seconds (to handle infinite scroll)
  if (pageIntervalId) {
    clearInterval(pageIntervalId);
  }

  // HACK: for now max 2 times (for development purposes)
  let count = 0;
  // eslint-disable-next-line no-undef
  pageIntervalId = window.setInterval(async () => {
    console.debug("urlUpdateHandler: Checking for new videos");
    const newVideos = await newVideosFromPage();
    if (newVideos.length > 0) {
      console.debug("urlUpdateHandler: New videos found");
      await handleNewVideos(newVideos);
    }
    count++;
    if (count > 2) {
      console.debug("urlUpdateHandler: Stopping interval");
      clearInterval(pageIntervalId);
    }
  }, 10000);
};

// // eslint-disable-next-line no-undef
// pageIntervalId = window.setInterval(async () => {
//   const newVideos = await new Promise<VideoIDWithExactHref[]>((resolve) => {
//     setTimeout(() => {
//       resolve(newVideosFromPage());
//     }, 2000);
//   });
//   if (newVideos.length > 0) {
//     handleNewVideos(newVideos);
//   }
// }, 10000);
// }

/**
 * New Videos From Page
 * 1. Get all the thumbnails on the page
 * 2. Check if the page has youtube thumbnails
 * 2.1 If it does, get the video ids from the thumbnails
 * 2.2 Remove duplicates (multiple thumbnails for the same video)
 * 3. If it does, store the urls of the thumbnails to prevent duplicate checks
 * 4. Return the urls of the thumbnails
 */

// TODO: Replace this with using the #video-title element (no need to check for duplicates and persists across page changes)
const newVideosFromPage = async (): Promise<VideoIDWithExactHref[]> => {
  const newVideoUrls: VideoIDWithExactHref[] = [];
  console.log("newVideosFromPage: pageVideos", pageVideos);

  // 1.
  // Get all the thumbnails on the page
  // eslint-disable-next-line no-undef
  const thumbnails = document.getElementsByClassName("ytd-thumbnail");

  // 2.
  // Check if the page has youtube thumbnails
  if (thumbnails && thumbnails.length > 0) {
    console.debug(
      "newVideosFromPage: found " +
        thumbnails.length +
        " thumbnails (including duplicates)"
    );

    // 2.1
    // If it does, get the video ids from the thumbnails
    for (let i = 0; i < thumbnails.length; i += 1) {
      const thumbnail = thumbnails[i];
      // eslint-disable-next-line no-undef
      const href = thumbnail.getAttribute("href");

      if (href) {
        const videoId = href.match(
          // /(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/
          /(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/
        )?.[0];

        if (videoId) {
          // 2.2
          // Remove duplicates (multiple thumbnails for the same video)
          if (pageVideos[href]) continue;

          if (videoId && videoId.length !== 11) {
            console.warn(
              "newVideosFromPage: potentially invalid videoId (wrong length)",
              videoId
            );
          }

          if (videoId && !pageVideos[href]) {
            newVideoUrls.push({
              videoId,
              exactHref: href,
            });
          }
        }
      }
    }
  }

  console.debug("newVideosFromPage: new videos", newVideoUrls.length);
  console.debug("newVideosFromPage: page videos", pageVideos.length);

  // 4.
  // Return the urls of the thumbnails and their exact href's
  return newVideoUrls;
};

// ========================= Channel Methods =========================
// #region Channel Methods
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

//#endregion

// ========================= Video Methods =========================
// #region Video Methods
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

// #endregion

{
  /* <div id="dismissible" class="style-scope ytd-compact-video-renderer">
  <ytd-thumbnail use-hovered-property="" class="style-scope ytd-compact-video-renderer" loaded=""><!--css-build:shady--><a id="thumbnail" class="yt-simple-endpoint inline-block style-scope ytd-thumbnail" aria-hidden="true" tabindex="-1" rel="nofollow" href="/watch?v=OCXHvP78CS8&amp;t=763s">
  <yt-image alt="" ftl-eligible="" notify-on-loaded="" notify-on-unloaded="" class="style-scope ytd-thumbnail"><img alt="" style="background-color: transparent;" class="yt-core-image--fill-parent-height yt-core-image--fill-parent-width yt-core-image yt-core-image--content-mode-scale-aspect-fill yt-core-image--loaded" src="https://i.ytimg.com/vi/OCXHvP78CS8/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&amp;rs=AOn4CLC6eHdplBHECZpgJd-ApwEWjmh52A"></yt-image>
  <yt-img-shadow ftl-eligible="" class="style-scope ytd-thumbnail" disable-upgrade="" hidden="">
  </yt-img-shadow>
  
  <div id="overlays" class="style-scope ytd-thumbnail"><ytd-thumbnail-overlay-resume-playback-renderer class="style-scope ytd-thumbnail"><!--css-build:shady--><div id="progress" class="style-scope ytd-thumbnail-overlay-resume-playback-renderer" style="width: 55%;"></div></ytd-thumbnail-overlay-resume-playback-renderer><ytd-thumbnail-overlay-time-status-renderer class="style-scope ytd-thumbnail" overlay-style="DEFAULT"><!--css-build:shady--><yt-icon size="16" class="style-scope ytd-thumbnail-overlay-time-status-renderer" disable-upgrade="" hidden=""></yt-icon><span id="text" class="style-scope ytd-thumbnail-overlay-time-status-renderer" aria-label="22 minutes, 48 seconds">
  22:48
</span></ytd-thumbnail-overlay-time-status-renderer><ytd-thumbnail-overlay-now-playing-renderer class="style-scope ytd-thumbnail"><!--css-build:shady--><span id="overlay-text" class="style-scope ytd-thumbnail-overlay-now-playing-renderer">Now playing</span>
<ytd-thumbnail-overlay-equalizer class="style-scope ytd-thumbnail-overlay-now-playing-renderer"><!--css-build:shady--><svg xmlns="http://www.w3.org/2000/svg" id="equalizer" viewBox="0 0 55 95" class="style-scope ytd-thumbnail-overlay-equalizer">
  <g class="style-scope ytd-thumbnail-overlay-equalizer">
    <rect class="bar style-scope ytd-thumbnail-overlay-equalizer" x="0"></rect>
    <rect class="bar style-scope ytd-thumbnail-overlay-equalizer" x="20"></rect>
    <rect class="bar style-scope ytd-thumbnail-overlay-equalizer" x="40"></rect>
  </g>
</svg>
</ytd-thumbnail-overlay-equalizer>
</ytd-thumbnail-overlay-now-playing-renderer></div>
  <div id="mouseover-overlay" class="style-scope ytd-thumbnail"></div>
  <div id="hover-overlays" class="style-scope ytd-thumbnail"></div>
</a>
</ytd-thumbnail>
  <div class="details style-scope ytd-compact-video-renderer">
    <div class="metadata style-scope ytd-compact-video-renderer">
      <a class="yt-simple-endpoint style-scope ytd-compact-video-renderer" rel="nofollow" href="/watch?v=OCXHvP78CS8&amp;t=763s">
        <h3 class="style-scope ytd-compact-video-renderer">
          
          <ytd-badge-supported-renderer class="top-badge style-scope ytd-compact-video-renderer" collection-truncate="" disable-upgrade="" hidden="">
          </ytd-badge-supported-renderer>
          <span id="video-title" class=" style-scope ytd-compact-video-renderer" aria-label="Real Lawyer Reacts to Law &amp; Order by LegalEagle 6 months ago 22 minutes 711,838 views" title="Real Lawyer Reacts to Law &amp; Order">
            Real Lawyer Reacts to Law &amp; Order
          </span>
        </h3>
        <div class="secondary-metadata style-scope ytd-compact-video-renderer">
          
          <ytd-video-meta-block class="compact style-scope ytd-compact-video-renderer" inline-badges="" no-endpoints="" truncate-metadata-line=""><!--css-build:shady-->
<div id="metadata" class="style-scope ytd-video-meta-block">
  <div id="byline-container" class="style-scope ytd-video-meta-block">
    <ytd-channel-name id="channel-name" class=" style-scope ytd-video-meta-block"><!--css-build:shady--><div id="container" class="style-scope ytd-channel-name">
  <div id="text-container" class="style-scope ytd-channel-name">
    <yt-formatted-string id="text" link-inherit-color="" title="" class="style-scope ytd-channel-name" ellipsis-truncate="" ellipsis-truncate-styling="">LegalEagle</yt-formatted-string>
  </div>
  <tp-yt-paper-tooltip fit-to-visible-bounds="" class="style-scope ytd-channel-name" role="tooltip" tabindex="-1"><!--css-build:shady--><div id="tooltip" class="hidden style-scope tp-yt-paper-tooltip" style-target="tooltip">
  
    LegalEagle
  
</div>
</tp-yt-paper-tooltip>
</div>
<ytd-badge-supported-renderer class="style-scope ytd-channel-name" system-icons=""><!--css-build:shady--><div class="badge badge-style-type-verified style-scope ytd-badge-supported-renderer" aria-label="Verified"><yt-icon class="style-scope ytd-badge-supported-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M12,2C6.5,2,2,6.5,2,12c0,5.5,4.5,10,10,10s10-4.5,10-10C22,6.5,17.5,2,12,2z M9.8,17.3l-4.2-4.1L7,11.8l2.8,2.7L17,7.4 l1.4,1.4L9.8,17.3z" class="style-scope yt-icon"></path></g></svg><!--css-build:shady--></yt-icon><span class="style-scope ytd-badge-supported-renderer"></span><tp-yt-paper-tooltip position="top" class="style-scope ytd-badge-supported-renderer" role="tooltip" tabindex="-1"><!--css-build:shady--><div id="tooltip" class="hidden style-scope tp-yt-paper-tooltip" style-target="tooltip">
  Verified
</div>
</tp-yt-paper-tooltip></div><dom-repeat id="repeat" as="badge" class="style-scope ytd-badge-supported-renderer"><template is="dom-repeat"></template></dom-repeat></ytd-badge-supported-renderer>
</ytd-channel-name>
    <div id="separator" class="style-scope ytd-video-meta-block">•</div>
    <yt-formatted-string id="video-info" class="style-scope ytd-video-meta-block" is-empty="" hidden=""><!--css-build:shady--><yt-attributed-string class="style-scope yt-formatted-string"></yt-attributed-string></yt-formatted-string>
  </div>
  <div id="metadata-line" class="style-scope ytd-video-meta-block">
    
    <ytd-badge-supported-renderer class="inline-metadata-badge style-scope ytd-video-meta-block" hidden="" system-icons=""><!--css-build:shady--><dom-repeat id="repeat" as="badge" class="style-scope ytd-badge-supported-renderer"><template is="dom-repeat"></template></dom-repeat></ytd-badge-supported-renderer>
    
      <span class="inline-metadata-item style-scope ytd-video-meta-block">711K views</span>
    
      <span class="inline-metadata-item style-scope ytd-video-meta-block">6 months ago</span>
    <dom-repeat strip-whitespace="" class="style-scope ytd-video-meta-block"><template is="dom-repeat"></template></dom-repeat>
  </div>
</div>
<div id="additional-metadata-line" class="style-scope ytd-video-meta-block">
  <dom-repeat class="style-scope ytd-video-meta-block"><template is="dom-repeat"></template></dom-repeat>
</div>

</ytd-video-meta-block>
          
          <ytd-badge-supported-renderer class="badges style-scope ytd-compact-video-renderer" system-icons=""><!--css-build:shady--><dom-repeat id="repeat" as="badge" class="style-scope ytd-badge-supported-renderer"><template is="dom-repeat"></template></dom-repeat></ytd-badge-supported-renderer>
        </div>
      </a>
      <div id="buttons" class="style-scope ytd-compact-video-renderer"></div>
    </div>
    <div id="menu" class="style-scope ytd-compact-video-renderer"><ytd-menu-renderer class="style-scope ytd-compact-video-renderer"><!--css-build:shady--><div id="top-level-buttons-computed" class="top-level-buttons style-scope ytd-menu-renderer"></div><div id="flexible-item-buttons" class="style-scope ytd-menu-renderer"></div><yt-icon-button id="button" class="dropdown-trigger style-scope ytd-menu-renderer" style-target="button"><!--css-build:shady--><button id="button" class="style-scope yt-icon-button" aria-label="Action menu"><yt-icon class="style-scope ytd-menu-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,6c0,0.83,0.67,1.5,1.5,1.5 s1.5-0.67,1.5-1.5S12.83,4.5,12,4.5S10.5,5.17,10.5,6z" class="style-scope yt-icon"></path></g></svg><!--css-build:shady--></yt-icon></button><yt-interaction id="interaction" class="circular style-scope yt-icon-button"><!--css-build:shady--><div class="stroke style-scope yt-interaction"></div><div class="fill style-scope yt-interaction"></div></yt-interaction></yt-icon-button><yt-button-shape id="button-shape" version="modern" class="style-scope ytd-menu-renderer" disable-upgrade="" hidden=""></yt-button-shape></ytd-menu-renderer></div>
    <div id="queue-button" class="style-scope ytd-compact-video-renderer"></div>
  </div>
</div> */
}
