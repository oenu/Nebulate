import { redirectHandler } from "../content_script";
import { CSS, CSS_CLASSES, Messages } from "../enums";

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

export const addNebulaControls = () => {
  // Add nebula controls
  const nebulate_button_exists = document.getElementById(
    CSS_CLASSES.NEBULA_VIDEO_BTN
  );
  if (!nebulate_button_exists) {
    const nebulate_button = document.createElement("img");
    nebulate_button.src = chrome.runtime.getURL("assets/nebula_temp_light.png");

    // Assign DOM element attributes
    nebulate_button.className = "ytp-button " + CSS_CLASSES.NEBULA_VIDEO_BTN;
    nebulate_button.id = CSS_CLASSES.NEBULA_VIDEO_BTN;
    nebulate_button.title = "RIGHT View this video on Nebula";

    youtube_right_controls =
      document.getElementsByClassName("ytp-right-controls")[0];

    youtube_right_controls.prepend(nebulate_button);
    nebulate_button.addEventListener("click", () => {
      redirectHandler(Messages.NEBULA_REDIRECT);
    });
    return;
  } else {
    console.debug("addNebulaControls: Nebulate button already exists");
    return;
  }
};

export const removeNebulaControls = () => {
  const nebulate_button = document.getElementById(CSS_CLASSES.NEBULA_VIDEO_BTN);
  if (nebulate_button) nebulate_button.remove();
};
