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
  console.time("onNewVideo");
  // Check if the video is new
  if (video === localVideo) {
    // If video is matched, check if the video button and style exist. If channel is known, add the button and style
    // Create array of promises
    const promises = [];
    if (video.matched) {
      promises.push(
        checkVideoButton(video)
          .then((exists) => {
            if (!exists) addVideoButton(video);
          })
          .catch((err) => {
            console.error("onNewVideo: Error checking video button", err);
          })
      );
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
      promises.push(
        checkChannelButton(video.channel)
          .then((exists) => {
            if (!exists) addChannelButton(video.channel);
          })
          .catch((err) => {
            console.error("onNewVideo: Error checking channel button: ", err);
          })
      );
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

    // Wait for all promises to resolve
    if (promises.length > 0) {
      console.time("onNewVideo: Promise.all");
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

    // Check if the channel is known - if so add the channel button and style channel box
    if (video.channel.known) {
      addChannelButton(video.channel);
      addChannelStyle(video.channel);
    } else {
      removeChannelButton();
      removeChannelStyle();
    }

    if (video.matched) {
      // Add the video button and style video box
      addVideoButton(video);
      addVideoStyle(video);
    } else {
      removeVideoButton();
      removeVideoStyle();
    }
  }
  console.timeEnd("onNewVideo");
};
