import { Messages } from "../../common/enums";
import { getOptions, optionUtilityType } from "../../common/options";
import {
  ChannelRedirectMessage,
  VideoRedirectMessage,
} from "../../common/types";

import { PopupRedirectMessage } from "../../popup";
import { channelRedirect } from "../handlers/channelRedirect";
import { reportIssue } from "../handlers/reportIssue";
import { videoRedirect } from "../handlers/videoRedirect";
import { summarizeTable } from "../table/summarizeTable";
import { updateTable } from "../table/updateTable";

chrome.runtime.onMessage.addListener(async (request, sender) => {
  try {
    console.log("BG: request: ", request);

    switch (request.type) {
      // Open the Nebula page for a video
      case Messages.VIDEO_REDIRECT: {
        const options = (await getOptions()) as optionUtilityType;
        const newTab = options.preferNewTab.value as boolean;
        const message = request as VideoRedirectMessage;
        if (request.video) videoRedirect(message.video, newTab, sender.tab?.id);
        break;
      }

      // Open the Nebula page for a channel
      case Messages.CHANNEL_REDIRECT: {
        const message = request as ChannelRedirectMessage;
        const options = (await getOptions()) as optionUtilityType;
        const newTab = options.preferNewTab.value as boolean;
        if (request.channel)
          channelRedirect(message.channel, newTab, sender.tab?.id);
        break;
      }

      // Open a url
      case Messages.POPUP_REDIRECT:
        {
          const message = request as PopupRedirectMessage;
          console.debug("BG: popup redirect: " + message.url);
          if (message.url) chrome.tabs.create({ url: message.url });
        }
        break;

      // Refresh the lookup table
      case Messages.REFRESH_TABLE: {
        updateTable();
        break;
      }

      // Report an error via email
      case Messages.REPORT_ISSUE: {
        reportIssue();
        break;
      }

      // Summarize the lookup table and return the result
      case Messages.SUMMARIZE_TABLE: {
        const table = await summarizeTable();
        chrome.runtime.sendMessage({
          type: Messages.SUMMARIZE_TABLE_RESPONSE,
          table,
        });

        break;
      }

      // Unknown message type
      default: {
        console.log("Unknown message type");
        break;
      }
    }
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onMessage.addListener: ", e);
  }

  return true;
});
