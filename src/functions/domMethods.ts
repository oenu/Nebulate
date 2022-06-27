import { redirectHandler } from "../content_script";

export const loadCSS = (css: string) => {
  if (css === "nebula") {
    const head = document.head || document.getElementsByTagName("head")[0];
    const style = document.createElement("style");
    style.id = "nebulate-extension";
    style.textContent = generateNebulaStyling();
    console.log("loading styling");
    setTimeout(() => {
      head.appendChild(style);
    }, 2000);
  }
};

export const unloadCSS = () => {
  console.debug("unloadCSS: uloading styling");
  var cssNode = document.getElementById("nebulate-extension");
  if (cssNode) {
    cssNode.remove();
    return;
  } else {
    console.log("Unload CSS: Could not find nebulate-extension node");
    return;
  }
};

export const setBg = (css: string) => {
  unloadCSS();
  setTimeout(() => loadCSS(css));
};

export const generateNebulaStyling = () => {
  // Default case for video player for glow effect
  let default_css = `#player {
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
  console.assert(
    player_height > player_width,
    "generateNebulaStyling: Vertical video detected"
  );

  return player_height > player_width ? shorts_css : default_css;
};

// let youtube_left_controls: Element | null = null;
let youtube_right_controls: Element | null = null;
let youtube_volume_controls: Element | null = null;
let youtube_player: Element | null = null;

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
    console.log("addNebulaControls: Nebulate button already exists");
    return;
  }
};

export const removeNebulaControls = () => {
  console.log("removeNebulaControls");
  const nebulate_button = document.getElementById("nebulate-btn");
  if (nebulate_button) {
    console.log("removeNebulaControls: Nebulate button exists");
    nebulate_button.remove();
  }
};

/**
 * const css = `html body {
 * background: url(${url}); \n
 * image-rendering: crisp-edges; \n
 * image-rendering: -webkit-optimize-contrast; \n
 * background-size:     cover; \n
 * background-repeat:   no-repeat; \n
 * background-position: center center; \n
 * }\n`;
 */
