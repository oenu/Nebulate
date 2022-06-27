import { redirectHandler } from "../content_script";
import { CSS, CSS_CLASSES } from "../enums";

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
    style.textContent = generateCreatorStyling();
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
          "nebulate-creator-css"
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

// export const setBg = (css: string) => {
//   unloadCSS( );
//   setTimeout(() => loadCSS(css));
// };
// IDEA: #11 Animated background slow transition through nebula colors, options menu
export const generateNebulaStyling = () => {
  // Default case for video player for glow effect
  // transition: box-shadow 0.5s ease-in-out 2s;
  let default_css = `#player {
    transition: box-shadow 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); \n
            box-shadow: -10px 0 40px rgb(62,	187,	243), 10px 0 40px rgb(88,	80,	209	);
            border-radius: 10px;
          };

  #player-theater-container {
  transition: box-shadow 0.5s ease-in-out 2s;
    
      box-shadow: \n
box-shadow: -10px 0 40px rgb(62,	187,	243), 10px 0 40px rgb(88,	80,	209	);




      0 0 50px #fff, \n
      -10px 0 80px #f0f, \n
      10px 0 80px #0ff; \n
  };\n
  `;

  // Select Internal video player to get tight side styling
  let shorts_css = `#movie_player > div.html5-video-container > video {
    transition: box-shadow 0.5s ease-in-out 2s;
  transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); \n     
    box-shadow: \n
      inset 0 0 60px whitesmoke, \n
      inset 20px 0 80px #f0f, \n
      inset -20px 0 80px #0ff, \n
      inset 20px 0 300px #f0f, \n
      inset -20px 0 300px #0ff, \n
      0 0 50px #fff, \n
      -10px 0 80px #f0f, \n
      10px 0 80px #0ff; \n
  }\n`;

  // Check aspect ratio of video
  const player = document.querySelector(
    "#movie_player > div.html5-video-container > video"
  );
  if (!player) return default_css; // Assume video exists
  const player_width = parseInt(window.getComputedStyle(player).width, 10);
  const player_height = parseInt(window.getComputedStyle(player).height, 10);
  if (player_height > player_width)
    console.info("generateNebulaStyling: Vertical video detected");

  return player_height > player_width ? shorts_css : default_css;
};

// IDEA: #10 Add css for creator home channel to identify as nebula creator
export const generateCreatorStyling = () => {
  let creator_css = `#owner {


}`;
  return creator_css;
};

// let youtube_left_controls: Element | null = null;
let youtube_right_controls: Element | null = null;

export const addNebulaControls = () => {
  // Add nebula controls
  const nebulate_button_exists = document.getElementById("nebulate-btn");
  if (!nebulate_button_exists) {
    const nebulate_button = document.createElement("img");
    nebulate_button.src = chrome.runtime.getURL("assets/nebula_temp_light.png");

    // Assign DOM element attributes
    nebulate_button.className = "ytp-button " + "nebulate-btn";
    nebulate_button.id = "nebulate-btn";
    nebulate_button.title = "RIGHT View this video on Nebula";

    youtube_right_controls =
      document.getElementsByClassName("ytp-right-controls")[0];

    youtube_right_controls.prepend(nebulate_button);
    nebulate_button.addEventListener("click", redirectHandler);
    return;
  } else {
    console.debug("addNebulaControls: Nebulate button already exists");
    return;
  }
};

export const removeNebulaControls = () => {
  console.debug("removeNebulaControls");
  const nebulate_button = document.getElementById("nebulate-btn");
  if (nebulate_button) {
    console.log("removeNebulaControls: Nebulate button exists");
    nebulate_button.remove();
  }
};
