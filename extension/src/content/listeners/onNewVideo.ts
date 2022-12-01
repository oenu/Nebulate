import { Video } from "../../common/types";
import { CheckedUrlResult } from "../../background/listeners/onTabUpdate";
import { Messages } from "../../common/enums";
import {
  addChannelButton,
  checkChannelButton,
  removeChannelButton,
} from "../handlers/interface/channelButton";
import {
  addChannelStyle,
  checkChannelStyle,
  removeChannelStyle,
} from "../handlers/interface/channelStyle";
import {
  addVideoButton,
  checkVideoButton,
  removeVideoButton,
} from "../handlers/interface/videoButton";
import {
  addVideoStyle,
  checkVideoStyle,
  removeVideoStyle,
} from "../handlers/interface/videoStyle";
import { getOptions } from "../../common/options";

let localVideo: Video;

chrome.runtime.onMessage.addListener(
  async (
    message
    // _sender, sendResponse
  ) => {
    console.debug("onNewVideo: Received message: ", message);
    if (message.type === Messages.CHECK_URL_RESULT) {
      const checkedUrlResult = message as CheckedUrlResult;
      if (checkedUrlResult.video) onNewVideo(checkedUrlResult.video);
    }
  }
);

// Handles a new video message sent by the background script
export const onNewVideo = async (video: Video): Promise<void> => {
  const options = await getOptions();

  // Check if any of the options are enabled
  if (
    !options.videoButton.value &&
    !options.videoGlow.value &&
    !options.channelButton.value &&
    !options.channelGlow.value
  ) {
    console.log("onNewVideo: Disabled");
    return;
  }

  console.time("onNewVideo");
  // Check if the video is new
  if (video === localVideo) {
    // If video is matched, check if the video button and style exist. If channel is known, add the button and style
    // Create array of promises
    const promises = [];
    if (video.matched) {
      options.videoButton.value &&
        promises.push(
          checkVideoButton(video)
            .then((exists) => {
              if (!exists) addVideoButton(video);
            })
            .catch((err) => {
              console.error("onNewVideo: Error checking video button", err);
            })
        );
      options.videoGlow.value &&
        promises.push(
          checkVideoStyle(video)
            .then((exists) => {
              if (!exists) addVideoStyle(video);
            })
            .catch((err) => {
              console.error("onNewVideo: Error checking video style", err);
            })
        );
    }

    if (video.channel.known) {
      options.channelButton.value &&
        promises.push(
          checkChannelButton(video.channel)
            .then((exists) => {
              if (!exists) addChannelButton(video.channel);
            })
            .catch((err) => {
              console.error("onNewVideo: Error checking channel button: ", err);
            })
        );
      options.channelGlow.value &&
        promises.push(
          checkChannelStyle(video.channel)
            .then((exists) => {
              if (!exists) addChannelStyle(video.channel);
            })
            .catch((err) => {
              console.error("onNewVideo: Error checking channel style: ", err);
            })
        );
    }

    if (promises.length > 0) {
      console.time("onNewVideo: Promise.all");
      // Wait for all promises to resolve
      await Promise.allSettled(promises);
      console.timeEnd("onNewVideo: Promise.all");
    } else {
      console.debug("onNewVideo: No promises to resolve");
    }
  } else {
    // New video
    localVideo = video;
    console.debug(
      "onNewVideo: video is new, updating localVideo: ",
      localVideo
    );

    // Add the channel button if the channel is known
    video.channel.known && options.channelButton.value
      ? addChannelButton(video.channel)
      : removeChannelButton();

    // Style the channel box if the channel is known
    video.channel.known && options.channelGlow.value
      ? addChannelStyle(video.channel)
      : removeChannelStyle();

    // Add the video button if the video is matched
    video.matched && options.videoButton.value
      ? addVideoButton(video)
      : removeVideoButton();

    // Style the video box if the video is matched
    video.matched && options.videoGlow.value
      ? addVideoStyle(video)
      : removeVideoStyle();
  }
  console.timeEnd("onNewVideo");
};
