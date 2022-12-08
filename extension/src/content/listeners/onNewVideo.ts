import { Video } from "../../common/types";
import { CheckedUrlResult } from "../../background/listeners/onTabUpdate";
import { Messages } from "../../common/enums";

import { getOptions } from "../../common/options";
import {
  checkChannelButton,
  addChannelButton,
  removeChannelButton,
} from "../handlers/interface/videoPage/channelButton";
import {
  checkChannelStyle,
  addChannelStyle,
  removeChannelStyle,
} from "../handlers/interface/videoPage/channelStyle";
import {
  checkVideoButton,
  addVideoButton,
  removeVideoButton,
} from "../handlers/interface/videoPage/videoButton";
import {
  checkVideoStyle,
  addVideoStyle,
  removeVideoStyle,
} from "../handlers/interface/videoPage/videoStyle";

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
    !options.addVideoButton.value &&
    !options.highlightVideo.value &&
    !options.addChannelButton.value &&
    !options.highlightChannel.value
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
      options.addVideoButton.value &&
        promises.push(
          checkVideoButton(video)
            .then((exists) => {
              if (!exists) addVideoButton(video);
            })
            .catch((err) => {
              console.error("onNewVideo: Error checking video button", err);
            })
        );
      options.highlightVideo.value &&
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
      options.addChannelButton.value &&
        promises.push(
          checkChannelButton(video.channel)
            .then((exists) => {
              if (!exists) addChannelButton(video.channel);
            })
            .catch((err) => {
              console.error("onNewVideo: Error checking channel button: ", err);
            })
        );
      options.highlightChannel.value &&
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
    video.channel.known && options.addChannelButton.value
      ? addChannelButton(video.channel)
      : removeChannelButton();

    // Style the channel box if the channel is known
    video.channel.known && options.highlightChannel.value
      ? addChannelStyle(video.channel)
      : removeChannelStyle();

    // Add the video button if the video is matched
    video.matched && options.addVideoButton.value
      ? addVideoButton(video)
      : removeVideoButton();

    // Style the video box if the video is matched
    video.matched && options.highlightVideo.value
      ? addVideoStyle(video)
      : removeVideoStyle();
  }
  console.timeEnd("onNewVideo");
};
