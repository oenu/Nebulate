console.log("CS: init");
// Runs in the context of the youtube tab

chrome.runtime.onMessage.addListener((obj, sender) => {
  console.log(obj);
  const { type } = obj;
  if (type === "NEW_VIDEO") {
    const { videoId, slug, matched, known } = obj;
    if (videoId === current_video_id) {
    } else if (videoId !== undefined) {
      console.log("CS: New video loaded: " + videoId);
      newVideoLoaded(videoId, known, matched, slug);
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
    type: "NEBULA_REDIRECT",
    url: current_video_id,
  });
};

// Send message to background script to open new tab
const nebulaRedirect = async (url: string) => {
  console.log("CS: Requesting redirect to: " + url);
};

const newVideoLoaded = async (
  videoId: string,
  known: boolean,
  matched?: boolean,
  slug?: string
) => {
  current_video_id = videoId;
  const nebulate_button_exists = document.getElementById("nebulate-btn");

  if (!nebulate_button_exists) {
    const nebulate_button_right = document.createElement("img");
    nebulate_button_right.src = chrome.runtime.getURL(
      "assets/nebula_temp_light.png"
    );
    nebulate_button_right.className = "ytp-button " + "nebulate-btn";
    nebulate_button_right.id = "nebulate-btn";
    nebulate_button_right.title = "RIGHT View this video on Nebula";

    youtube_right_controls =
      document.getElementsByClassName("ytp-right-controls")[0];
    // // document.getElementsByClassName("ytp-left-controls")[0];
    // youtube_player = document.getElementsByClassName("video-stream")[0];

    youtube_right_controls.prepend(nebulate_button_right);
    nebulate_button_right.addEventListener("click", redirectHandler);
  }
};

// IDEA: #1 Highlight the video with a blue border if it has a match
// IDEA: #4 Whenever on a nebula creators video, highlight the creator / indicate that they are a nebula creator
