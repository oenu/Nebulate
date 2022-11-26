import { CSS_IDS, BUTTON_IDS } from "../../enums";

/**
 * Add Channel Styling
 * 1. Create the style element
 * 1.1 Set the id
 * 1.2 Add a glow to the channel box
 * 2. Add the style to the page
 */
export const addChannelCSS = (): Promise<void> => {
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
export const removeChannelCSS = (): Promise<void> => {
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
