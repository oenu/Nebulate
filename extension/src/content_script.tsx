import { BUTTON_IDS, CSS_CLASSES, CSS_IDS, Messages } from "./enums";
import { Channel, Video } from "./types";

console.debug("CS: init");
// // Runs in the context of the youtube tab

// Local Variables:
let localChannel: Channel | undefined;
let localVideo: Video | undefined;
let pageVideos: {
  [videoId: string]: Video;
};

let pageIntervalId: number;

// Local Message Types
export type VideoRedirectMessage = {
  type: Messages.VIDEO_REDIRECT;
  video: Video;
};

export type ChannelRedirectMessage = {
  type: Messages.CHANNEL_REDIRECT;
  channel: Channel;
};

export type CheckVideoMessage = {
  type: Messages.CHECK_VIDEO;
  url: string;
};

export type UrlUpdateMessage = {
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
 * Handle adding styling to new videos
 * 1. Pass the video ids to the background script
 * 2. Wait for the background script to respond with the videos
 * 3. Update the page videos with whether they are known or matched
 */

const handleNewVideos = async (newVideos: string[]): Promise<void> => {
  // 1.
  // Pass the video ids to the background script
  const checkVideoPromises = newVideos.map((video) => {
    return new Promise<Video>((resolve, reject) => {
      const message: CheckVideoMessage = {
        type: Messages.CHECK_VIDEO,
        url: video,
      };
      chrome.runtime.sendMessage(message, (response: Video) => {
        !response ? reject() : resolve(response);
      });
    });
  });

  // 2.
  // Wait for the background script to respond with the videos
  const checkVideoResponses = await Promise.allSettled(checkVideoPromises);

  // 3.
  // Update the page videos with whether they are known or matched
  checkVideoResponses.forEach((response) => {
    if (response.status === "fulfilled") {
      const video = response.value;
      pageVideos[video.videoId] = video;
    }
  });
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
  const newVideos = await new Promise<string[]>((resolve) => {
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
  // eslint-disable-next-line no-undef
  pageIntervalId = window.setInterval(async () => {
    const newVideos = await new Promise<string[]>((resolve) => {
      setTimeout(() => {
        resolve(newVideosFromPage());
      }, 2000);
    });
    if (newVideos.length > 0) {
      handleNewVideos(newVideos);
    }
  }, 10000);
};

/**
 * New Videos From Page
 * 1. Get all the thumbnails on the page
 * 2. Check if the page has youtube thumbnails
 * 2.1 If it does, get the video ids from the thumbnails
 * 2.2 Remove duplicates (multiple thumbnails for the same video)
 * 3. If it does, store the urls of the thumbnails to prevent duplicate checks
 * 4. Return the urls of the thumbnails
 */
const newVideosFromPage = async (): Promise<string[]> => {
  const newVideoUrls: string[] = [];

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
          if (pageVideos[videoId]) continue;

          if (videoId && videoId.length !== 11) {
            console.warn(
              "newVideosFromPage: potentially invalid videoId (wrong length)",
              videoId
            );
          }

          if (videoId && !pageVideos[videoId]) {
            newVideoUrls.push(videoId);
          }
        }
      }
    }
  }

  console.debug("newVideosFromPage: new videos", newVideoUrls.length);
  console.debug("newVideosFromPage: page videos", pageVideos.length);

  // 4.
  // Return the urls of the thumbnails
  return newVideoUrls;
};

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
// ========================= Bulk Methods =========================
/**
 * checkVideo
 * 1. Send a message to the background script to check if the video is on Nebula
 * 2. Return the response formatted as { known: boolean, match: boolean }
 */
// const checkVideo = (
//   url: string
// ): Promise<{
//   known: boolean;
//   matched: boolean;
// }> => {
//   return new Promise((resolve, reject) => {
//     try {
//       console.debug("checkVideo: Checking video");

//       // 1.
//       // Send a message to the background script to check if the video is on Nebula
//       const message: CheckVideoMessage = {
//         type: Messages.CHECK_VIDEO,
//         url,
//       };

//       chrome.runtime.sendMessage(message, (video: Video | null) => {
//         if (video?.matched) {
//           resolve({ known: true, matched: true });
//         } else if (video?.known) {
//           resolve({ known: true, matched: false });
//         } else {
//           resolve({ known: false, matched: false });
//         }
//       });
//     } catch (e) {
//       console.error("checkVideo: Error checking video", e);
//       reject(e);
//     }
//   });
// };

// // eslint-disable-next-line no-undef
// const observer = new MutationObserver(function (mutations) {
//   mutations.forEach(function (mutation) {
//     if (mutation.addedNodes.length) {
//       if (mutation.type == "childList") {
//         mutation.addedNodes.forEach((node) => {
//           console.debug("MutationObserver: Added node", node);
//         });
//       }
//     }
//   });
// });

// ==== Notes for identifying all videos ====
// When new video loads (from background script or maybe from the page itself), wait for 2 seconds, get all thumbnails, and check if they are on Nebula
// After checking store all the videos we checked in a variable that gets wiped when a new video loads
// Every 10 seconds or so, get all the thumbnails and check if they are on Nebula (excluding the ones we already checked)
// Repeat the above

// Also: Maybe check just the number of thumbnails and if it changes, check all of them

//Pros:
// 1. We can check all the videos on the page
// 2. We can check all the videos on the page even if the user doesn't click on them
// 3. If a user loads more videos or changes the SSR page we can check those videos too

//Cons:
// 1. We have to check all the videos on the page
// 2. We have to store all the videos we checked in a variable that gets wiped when a new video loads

// // Identify all videos on the page
// const identifyVideos = (): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     try {
//       console.debug("identifyVideos: Identifying videos");

//       // 1.
//       // Get all the thumbnails
//       // eslint-disable-next-line no-undef
//       const thumbnails = document.getElementsByTagName("ytd-thumbnail");
//       console.debug("identifyVideos: Thumbnails", thumbnails);

//       // 2.
//       // Check if the video is on Nebula
//       // eslint-disable-next-line no-undef
//       const videos = Array.from(thumbnails).map((thumbnail) => {
//         const video = thumbnail.querySelector("a")?.href;
//         if (video) {
//           const videoId = video.match(
//             // /(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/
//             /(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/
//           )?.[0];
//           console.debug(`identifyVideos: Video ID: ${videoId}`);
//           return videoId;
//         }
//       });

//       // 3.
//       // Send a message to the background script to check if the video is on Nebula and wait using Promise.all

//       //   const message: CheckVideosMessage = {
//       //     type: Messages.CHECK_VIDEOS,
//       //     videos,
//       //   };
//       //   chrome.runtime.sendMessage(message, (videos: Video[]) => {
//       //     console.debug("identifyVideos: Videos", videos);

//       //     // 4.
//       //     // Add the video status to the thumbnail
//       //     // eslint-disable-next-line no-undef
//       //     Array.from(thumbnails).forEach((thumbnail) => {
//       //       // 4.1
//       //       // Get the video id
//       //       const video = thumbnail.querySelector("a")?.href;
//       //       if (video) {
//       //         const videoId = video.match(
//       //           // /(?<=[=\/&])[a-zA-Z0-9_\-]{11}(?=[=\/&?#\n\r]|$)/
//       //           /(?<=[=/&])[a-zA-Z0-9_-]{11}(?=[=/&?#\n\r]|$)/
//       //         )?.[0];
//       //         console.debug(`identifyVideos: Video ID: ${videoId}`);

//       //         // 4.2
//       //         // Get the video status
//       //         const videoStatus = videos.find((v) => v.id === videoId);

//       //         // 4.3
//       //         // Add the video status to the thumbnail
//       //         if (videoStatus?.matched) {
//       //           thumbnail.classList.add("nebula-video");
//       //         } else if (videoStatus?.known) {
//       //           thumbnail.classList.add("nebula-video-known");
//       //         }
//       //       }
//       //     });

//       //     resolve();
//       //   });
//       // }

//       videos.forEach((video) => {
//         if (video) {
//           const message: CheckVideoMessage = {
//             type: Messages.CHECK_VIDEO,
//             url: video,
//           };

//           chrome.runtime.sendMessage(message, (video: Video | null) => {
//             console.debug("identifyVideos: Video Response From BG:", video);
//             if (video?.matched) {
//               console.debug("identifyVideos: Video Matched!", video);
//             } else if (video?.known) {
//               console.debug("identifyVideos: Video Known!", video);
//             } else {
//               console.debug("identifyVideos: Video is not known", video);
//             }
//           });
//         }
//       });

//       resolve();
//     } catch (e) {
//       console.error("identifyVideos: Error identifying videos", e);
//       reject(e);
//     }
//   });
// };

// setTimeout(() => {
//   identifyVideos();
// }, 3000);
