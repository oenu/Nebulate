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
  removeChannelStyle,
} from "../handlers/interface/channelStyle";
import {
  addVideoButton,
  checkVideoButton,
  removeVideoButton,
} from "../handlers/interface/videoButton";
import {
  addVideoStyle,
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
    // Existing video
    if (video.matched)
      // Check if video button needs to be re-added
      (await checkVideoButton(video)) && (await addVideoButton(video));

    if (video.channel.known)
      // Check if channel button needs to be re-added
      (await checkChannelButton(video.channel)) &&
        (await addChannelButton(video.channel));
  }

  // New video
  localVideo = video;
  console.debug("onNewVideo: video is new, updating localVideo: ", localVideo);

  // Check if the video is known - if so add the channel button and style channel box
  video.known ? addChannelButton(video.channel) : removeChannelButton();
  video.known ? addChannelStyle(video.channel) : removeChannelStyle();

  // Check if the video is on Nebula - if so add the video button
  video.matched ? addVideoButton(video) : removeVideoButton();
  video.matched ? addVideoStyle(video) : removeVideoStyle();
  console.timeEnd("onNewVideo");
};
