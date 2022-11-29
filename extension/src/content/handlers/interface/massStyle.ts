// Adds styling to all the videos on the page if they are on Nebula - uses css selectors instead of video elements

import { CSS_IDS } from "../../../common/enums";
import { Video } from "../../../common/types";

// Options - To be fleshed out later

const options = {
  matchedColor: "#3EBBF3",
};

export const addMassStyle = async (videos: Video[]): Promise<void> => {
  const massStyle = videos.map((video) => {
    // Video player page
    const videoPageChannelName = `
      a[href*="${video.videoId}"]:not([href*="start_radio"]) #channel-name yt-formatted-string 
      { color: ${options.matchedColor} !important }`;

    const videoPageVideoTitle = `
      a[href*="${video.videoId}"]:not([href*="start_radio"]) #video-title
      { color: ${options.matchedColor} !important }`;

    // Subscription page
    const subscriptionPageChannelName = `
      div#details:has(a[href*="${video.videoId}"]) ytd-channel-name#channel-name a
      { color: ${options.matchedColor} !important }`;
    const subscriptionPageVideoTitle = `
      a[href*="${video.videoId}"]#video-title
      { color: ${options.matchedColor} !important }`;

    // Thumbnail - for both pages
    const thumbnail = `
      a[href*="${video.videoId}"]:not([href*="start_radio"]).ytd-thumbnail
      { border: 2px solid ${options.matchedColor} !important }`;

    return [
      videoPageVideoTitle,
      videoPageChannelName,
      subscriptionPageChannelName,
      subscriptionPageVideoTitle,
      thumbnail,
    ].join("");
  });

  // eslint-disable-next-line no-undef
  let styleElement = document.getElementById(CSS_IDS.MASS_VIDEO);
  if (!styleElement) {
    // eslint-disable-next-line no-undef
    styleElement = document.createElement("style");
    styleElement.id = CSS_IDS.MASS_VIDEO;
    // eslint-disable-next-line no-undef
    document.head.appendChild(styleElement);
  }

  styleElement.innerHTML = massStyle.join("");
};

// Removes styling from all the videos on the page if they are not on Nebula - uses css selectors instead of video elements

export const removeMassStyle = async (): Promise<void> => {
  // eslint-disable-next-line no-undef
  while (document.getElementById(CSS_IDS.MASS_VIDEO)) {
    // eslint-disable-next-line no-undef
    const styleElement = document.getElementById(
      CSS_IDS.MASS_VIDEO
      // eslint-disable-next-line no-undef
    ) as HTMLStyleElement;

    if (styleElement) {
      styleElement.innerHTML = "";
    }
  }
};
