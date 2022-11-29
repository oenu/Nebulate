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
        checkVideoButton(video).then((exists) => {
          if (!exists) addVideoButton(video);
        })
      );
      promises.push(
        checkVideoStyle(video).then((exists) => {
          if (!exists) addVideoStyle(video);
        })
      );
    }

    if (video.channel.known) {
      promises.push(
        checkChannelButton(video.channel).then((exists) => {
          if (!exists) addChannelButton(video.channel);
        })
      );
      promises.push(
        checkChannelStyle(video.channel).then((exists) => {
          if (!exists) addChannelStyle(video.channel);
        })
      );
    }

    // Wait for all promises to resolve
    if (promises.length > 0) {
      console.time("onNewVideo: Promise.all");
      await Promise.all(promises);
      console.timeEnd("onNewVideo: Promise.all");
    }
  } else {
    // New video
    localVideo = video;
    console.debug(
      "onNewVideo: video is new, updating localVideo: ",
      localVideo
    );

    // Check if the video is known - if so add the channel button and style channel box
    video.known ? addChannelButton(video.channel) : removeChannelButton();
    video.known ? addChannelStyle(video.channel) : removeChannelStyle();

    // Check if the video is on Nebula - if so add the video button
    video.matched ? addVideoButton(video) : removeVideoButton();
    video.matched ? addVideoStyle(video) : removeVideoStyle();
    console.timeEnd("onNewVideo");
  }
};
