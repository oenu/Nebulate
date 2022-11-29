// Adds styling to the active video if it is on Nebula

import { CSS_IDS } from "../../../common/enums";
import { Video } from "../../../common/types";

// TODO: Add video identifier to css selectors to avoid conflicts
export const addVideoStyle = async (video: Video): Promise<void> => {
  console.debug("addVideoStyle: adding video style for video: ", video);
  const videoStyle = `
  /* Mini Player */
  .miniplayer #container:has(video) {
    box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) 1s;
    clip-path: inset(-100% -100% 0 -100%);
  }
  
  /* Theatre Player */
  #player-theater-container #container:has(video) {
    box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
    transition: box-shadow 1s cubic-bezier(0.165, 0.84, 0.44, 1) 1s
    /* clip-path: inset(0px -100vw 0px -100vw); */;
  }
    
  /* Normal Player */
  :not(.ytd-page-manager[theater]) #container:has(video) {
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    transition-delay: 0.5s;
    box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
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
    // eslint-disable-next-line no-undef
    document.head.appendChild(videoStyleElement);
  } else {
    videoStyleElement.innerHTML = videoStyle;
  }
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
      videoStyleElement.innerHTML = "";
    }
  }
};
