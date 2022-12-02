// Adds styling to the active video if it is on Nebula

import { CSS_IDS } from "../../../common/enums";
import { getOptions } from "../../../common/options";
// import { getOptions } from "../../../common/options";
import { Video } from "../../../common/types";

// TODO: Add video identifier to css selectors to avoid conflicts
export const addVideoStyle = async (video: Video): Promise<void> => {
  // Wait for the video to load

  // Check if adding video style is enabled
  const options = await getOptions();

  if (!options.videoGlow.value) {
    throw new Error("Options are set to not show on video page");
  }

  if (!options.gradientStart.value) {
    console.warn("Gradient start color not set, using default");
    options.gradientStart.value = "rgb(62, 187, 243)";
  }

  if (!options.gradientEnd.value) {
    console.warn("Gradient end color not set, using default");
    options.gradientEnd.value = "rgb(88, 80, 209)";
  }

  waitForVideo(10000)
    .catch(() => {
      throw new Error("Video failed to load");
    })
    .then(() => {
      console.debug("addVideoStyle: adding video style for video: ", video);

      const videoStyle = `
      /* Nebulate Video Style ${video.videoId} */

  /* Mini Player */
  .miniplayer #container:has(video) {
    box-shadow: -10px 0 40px ${options.gradientStart.value}, 10px 0 40px ${options.gradientEnd.value} !important;
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
    clip-path: inset(-100% -100% 0 -100%);
  }
  
  /* Theatre Player */
  #player-theater-container #container:has(video) {
    box-shadow: -10px 0 40px ${options.gradientStart.value}, 10px 0 40px ${options.gradientEnd.value} !important;
    transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s
    /* clip-path: inset(0px -100vw 0px -100vw); */;
  }
    
  /* Normal Player */
  :not(.ytd-page-manager[theater]) #container:has(video) {
    box-shadow: -10px 0 40px ${options.gradientStart.value}, 10px 0 40px ${options.gradientEnd.value} !important;
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    transition-delay: 0.5s;
  }`;
      // eslint-disable-next-line no-undef
      let videoStyleElement = document.getElementById(
        CSS_IDS.VIDEO
        // eslint-disable-next-line no-undef
      ) as HTMLStyleElement;

      if (!videoStyleElement) {
        // eslint-disable-next-line no-undef
        videoStyleElement = document.createElement("style");
        videoStyleElement.id = CSS_IDS.VIDEO;
        videoStyleElement.innerHTML = videoStyle;
        // eslint-disable-next-line no-undef
        document.head.appendChild(videoStyleElement);
      } else {
        videoStyleElement.innerHTML = videoStyle;
      }
    });
};

// Wait for the video to load
const waitForVideo = async (msDelay: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.time("Video loaded in");

    // Set a timeout to 10 seconds
    const timeout = setTimeout(() => {
      console.log(`Timed out waiting ${msDelay}ms for video to load`);
      reject();
    }, msDelay);

    // eslint-disable-next-line no-undef
    const videoObserver = new MutationObserver(() => {
      // eslint-disable-next-line no-undef
      const video = document.querySelector("video");
      if (video) {
        videoObserver.disconnect();
        console.timeEnd("Video loaded in");
        clearTimeout(timeout);
        resolve();
      }
    });

    const checker = (): void => {
      if (
        // eslint-disable-next-line no-undef
        document.querySelector(".miniplayer #container:has(video)") ||
        // eslint-disable-next-line no-undef
        document.querySelector(
          "#player-theater-container #container:has(video)"
        ) ||
        // eslint-disable-next-line no-undef
        document.querySelector(
          ":not(.ytd-page-manager[theater]) #container:has(video)"
        )
      ) {
        videoObserver.disconnect();
        console.timeEnd("Video loaded in");
        clearTimeout(timeout);
        resolve();
      }
    };

    // Check that the video is not already loaded
    checker();

    console.log(`Waiting ${msDelay}ms for video to load`);
    // eslint-disable-next-line no-undef
    videoObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

// Removes styling from the active video if it is not on Nebula
export const removeVideoStyle = async (): Promise<void> => {
  // eslint-disable-next-line no-undef
  while (document.getElementById(CSS_IDS.VIDEO)) {
    // eslint-disable-next-line no-undef
    const videoStyleElement = document.getElementById(
      CSS_IDS.VIDEO
      // eslint-disable-next-line no-undef
    ) as HTMLStyleElement;

    if (videoStyleElement) {
      videoStyleElement.remove();
    }
  }
};

export const checkVideoStyle = async (video: Video): Promise<boolean> => {
  try {
    console.debug(
      "checkVideoStyle: Checking if video style exists for video: ",
      video
    );
    // eslint-disable-next-line no-undef
    const style = document.getElementById(CSS_IDS.VIDEO);
    if (style) {
      console.debug("checkVideoStyle: Video style exists");
      return Promise.resolve(true);
    } else {
      console.debug("checkVideoStyle: Video style does not exist");
      return Promise.resolve(false);
    }
  } catch (error) {
    console.error("checkVideoStyle: " + error);
    return Promise.reject();
  }
};
