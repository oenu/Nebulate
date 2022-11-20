import { redirectHandler } from "../content_script";
import { CSS, CSS_CLASSES, Messages } from "../enums";

// Load the CSS for Videos or Creator depending on the message
export const loadCSS = (css: CSS) => {
  if (css === CSS.NEBULA_VIDEO) {
    const head = document.head || document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    style.className = CSS_CLASSES.NEBULA;
    style.textContent = generateNebulaStyling();
    console.debug("loadCSS: loading styling" + css);
    setTimeout(() => {
      head.appendChild(style);
    }, 2000);
  }
  if (css === CSS.CREATOR) {
    const head = document.head || document.getElementsByTagName("head")[0];
    const style = document.createElement("style");

    style.className = CSS_CLASSES.CREATOR;
    style.textContent = generateChannelStyling();
    console.debug("loadCSS: loading styling" + css);
    setTimeout(() => {
      head.appendChild(style);
    }, 2000);
  }
};

// Remove the CSS for Videos or Creator depending on the message
export const unloadCSS = (css: CSS) => {
  console.debug("unloadCSS: unloading styling");
  try {
    switch (css) {
      case CSS.NEBULA_VIDEO:
        for (let element of document.getElementsByClassName(
          CSS_CLASSES.NEBULA
        )) {
          element.remove();
        }
        break;
      case CSS.CREATOR:
        for (let element of document.getElementsByClassName(
          "nebulate-channel-css"
        )) {
          element.remove();
        }
        break;
    }
  } catch (error) {
    console.warn(`Unload CSS: Could not find ${css} node`);
    return;
  }
};

// Add a background glow to the video player to indicate that the video is on Nebula
export const generateNebulaStyling = () => {
  let default_css = `#player {
  transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: -10px 0 40px rgb(62, 187, 243), 10px 0 40px rgb(88, 80, 209);
}

#movie_player > div.html5-video-container > video {
  transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow: -10px 0 10vw rgb(62, 187, 243), 10px 0 10vw rgb(88, 80, 209);
  clip-path: inset(0px -100vw 0px -100vw);
}`;

  // Check aspect ratio of video
  const player = document.querySelector(
    "#movie_player > div.html5-video-container > video"
  );
  if (!player) return default_css; // Assume video exists
  const player_width = parseInt(window.getComputedStyle(player).width, 10);
  const player_height = parseInt(window.getComputedStyle(player).height, 10);
  if (player_height > player_width)
    console.info("generateNebulaStyling: Vertical video detected");

  return player_height > player_width ? default_css : default_css;
};

// Add a blue border to the channel icon and name box to indicate that the channel is on Nebula
export const generateChannelStyling = () => {
  let channel_css = `
  #avatar {
    transition: outline 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
    outline: 3px solid rgb(62, 187, 243);
    outline-offset: 1px;
  }

  #owner {
    transition: border 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
     border: 1px solid rgb(62, 187, 243) !important; 
    /* background-color: rgb(62, 187, 243); */
  }


}`;
  return channel_css;
};

let youtube_right_controls: Element | null = null;

// Generate Creator redirect button styling
export const generateCreatorRedirectStyling = () => {
  //   let creator_redirect_css = `
  //   .nebulate-creator-redirect {
  //     background-color: rgb(62, 187, 243) !important;
  //     border-radius: 2px;
  //     color: rgb(255, 255, 255);
  //     padding: var(--yt-button-padding);
  //     margin: auto var(--ytd-subscribe-button-margin,4px);
  //     white-space: nowrap;
  //     font-size: var(--ytd-tab-system-font-size);
  //     font-weight: var(--ytd-tab-system-font-weight);
  //     letter-spacing: var(--ytd-tab-system-letter-spacing);
  //     text-transform: var(--ytd-tab-system-text-transform);
  //     display: flex;
  //     flex-direction: row;
  // }`;
  const creator_redirect_css = `
  .nebulate-creator-redirect {
    max-height: 100%;
    max-width: 100%;

    // Indicate that the button is clickable
    cursor: pointer;
    

// Add on-hover styling
    &:hover {

      color: rgb(255, 255, 255);



  }`;

  return creator_redirect_css;
};

export const addCreatorRedirect = () => {
  console.debug("addCreatorRedirect: Adding redirect button");

  // Check if button already exists
  if (document.getElementsByClassName("nebulate-creator-redirect").length > 0)
    return;

  // Create a clickable png
  const nebulate_logo = document.createElement("img");
  nebulate_logo.src = chrome.runtime.getURL("assets/icon.png");

  nebulate_logo.className = "nebulate-creator-redirect";
  // Indicate that the button is clickable
  nebulate_logo.style.cursor = "pointer";

  // Add Creator Redirect Styling
  const head = document.head || document.getElementsByTagName("head")[0];
  const redirectStyling = document.createElement("style");
  if (
    // Check if the redirect styling has already been added
    document.getElementsByClassName("nebulate-creator-redirect-css").length ===
    0
  ) {
    redirectStyling.className = "nebulate-creator-redirect-css";
    redirectStyling.textContent = generateCreatorRedirectStyling();
    head.appendChild(redirectStyling);
  }

  nebulate_logo.addEventListener("click", () => {
    redirectHandler(Messages.CREATOR_REDIRECT);
  });

  // Check if the subscribe button exists
  const subscribe_button = document.querySelector(
    "#subscribe-button:not(.skeleton-bg-color)"
  );
  if (subscribe_button) {
    // Add the button to the DOM
    console.log(subscribe_button);
    console.debug("addCreatorRedirect: Adding button to DOM");
    subscribe_button.insertAdjacentElement("beforebegin", nebulate_logo);
  } else {
    console.warn(
      "addCreatorRedirect: Could not find subscribe button, waiting"
    );
    setTimeout(
      () => {
        addCreatorRedirect();
      } /* 1 second */,
      1000
    );
  }
};

// Remove creator redirect button
export const removeCreatorRedirect = () => {
  const creator_redirect = document.getElementById("nebulate-creator-redirect");
  if (!creator_redirect) {
    console.warn(
      "removeCreatorRedirect: Could not find creator redirect button"
    );
    return;
  }
  creator_redirect.remove();
};

// Add a button to the YouTube player to redirect to the Nebula video
export const addNebulaControls = () => {
  // Add nebula controls
  const nebulate_button_exists = document.getElementById(
    CSS_CLASSES.NEBULA_VIDEO_BTN
  );
  if (!nebulate_button_exists) {
    const nebulate_button = document.createElement("img");
    nebulate_button.src = chrome.runtime.getURL("assets/icon.png");

    // Assign DOM element attributes
    nebulate_button.className = "ytp-button " + CSS_CLASSES.NEBULA_VIDEO_BTN;
    nebulate_button.id = CSS_CLASSES.NEBULA_VIDEO_BTN;
    nebulate_button.title = "View this video on Nebula";

    youtube_right_controls =
      document.getElementsByClassName("ytp-right-controls")[0];

    youtube_right_controls.prepend(nebulate_button);
    nebulate_button.addEventListener("click", () => {
      redirectHandler(Messages.VIDEO_REDIRECT);
    });
    return;
  } else {
    console.debug("addNebulaControls: Nebulate button already exists");
    return;
  }
};

// Remove the Nebula button from the YouTube player
export const removeNebulaControls = () => {
  const nebulate_button = document.getElementById(CSS_CLASSES.NEBULA_VIDEO_BTN);
  if (nebulate_button) nebulate_button.remove();
};
