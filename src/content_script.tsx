console.log("CS: init");
// Runs in the context of the youtube tab

chrome.runtime.onMessage.addListener((obj, sender) => {
  const { type, value, videoId } = obj;
  if (type === "NEW") {
    if (videoId === current_video_id) {
    } else if (videoId !== undefined) {
      console.log("CS: New video loaded: " + videoId);
      newVideoLoaded(videoId);
    }
  }
  return;
});

// Types
interface Video {
  url: string;
  channel_slug: string;
  matched: boolean;
}

// (() => {
let youtube_left_controls: Element | null = null;
let youtube_right_controls: Element | null = null;
let youtube_volume_controls: Element | null = null;
let youtube_player: Element | null = null;
let current_video_id: string | null = null;

const redirectHandler = async () => {
  // Request redirect address for current video
  console.log("Requesting redirect address for current video");
  chrome.runtime.sendMessage({
    type: "REDIRECT_REQUEST",
    videoId: current_video_id,
  });

  console.log(youtube_player);
  // fetch(`http://localhost:3000/lookup/${current_video_id}`)
  //   .then((response) => response.json())
  //   .then((data) => console.log(data));

  // if (response.status !== 200) {
  //   console.log("Error: " + response.status);
  //   return;
  // }

  // nebulaRedirect(nebular_redirect_url);
};

const newVideoLoaded = async (videoId: string) => {
  current_video_id = videoId;

  const nebulate_button_exists =
    document.getElementsByClassName("nebulate-btn")[0];

  if (!nebulate_button_exists) {
    const nebulate_button_right = document.createElement("img");
    nebulate_button_right.src = chrome.runtime.getURL(
      "assets/nebula_temp_light.png"
    );
    nebulate_button_right.className = "ytp-button " + "nebulate-btn";
    nebulate_button_right.title = "RIGHT View this video on Nebula";

    youtube_right_controls =
      document.getElementsByClassName("ytp-right-controls")[0];
    // // document.getElementsByClassName("ytp-left-controls")[0];
    // youtube_player = document.getElementsByClassName("video-stream")[0];

    youtube_right_controls.prepend(nebulate_button_right);

    nebulate_button_right.addEventListener("click", redirectHandler);
  }
};

// Check if video has a known match
const checkIfVideoKnown = async (videoId: string) => {
  console.log("CS: Checking if video has a known match");
  chrome.storage.local.get([videoId], (obj: any) => {
    const video = obj[videoId] ? JSON.parse(obj[videoId]) : null;
  });
};

// Send message to background script to open new tab
const nebulaRedirect = async (url: string) => {
  console.log("CS: Requesting redirect to: " + url);
  chrome.runtime.sendMessage({
    type: "NEBULA_REDIRECT",
    url: url,
  });
};

// IDEA: #1 Highlight the video with a blue border if it has a match
// IDEA: #4 Whenever on a nebula creators video, highlight the creator / indicate that they are a nebula creator
