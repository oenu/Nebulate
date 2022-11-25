import { CSS_IDS } from "../../enums";

/**
 * AddVideoCSS
 * 1. Create the style element
 * 1.1 Set the id
 * 1.2 Add a glow to the video box
 * 2. Add the style to the page
 */
export const addVideoCSS = (): Promise<void> => {
  // 1.
  // Create the style element
  // eslint-disable-next-line no-undef
  const style = document.createElement("style");
  // 1.1
  // Set the id
  style.id = CSS_IDS.VIDEO;
  // 1.2
  // Add a glow to the video box
  style.innerHTML = `
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
export const removeVideoCSS = (): Promise<void> => {
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
