import { Messages } from "../../common/enums";
import { getOptions } from "../../common/options";
import { watchSubscriptionPage } from "../handlers/scrape/watchSubscriptionPage";

// eslint-disable-next-line no-undef
let observer: MutationObserver | undefined;

// Listen for the background script to tell us we are on a subscription page
chrome.runtime.onMessage.addListener(
  async (
    message
    // _sender, sendResponse
  ) => {
    if (message.type === Messages.URL_UPDATE) {
      const options = await getOptions();

      if (!options.subscriptionsShow.value) {
        console.log("onSubscriptionPage: Disabled");
        return;
      }

      console.debug("onSubscriptionPage: Received message: ", message);
      // eslint-disable-next-line no-undef
      if (window.location.href.includes("youtube.com/feed/subscriptions")) {
        console.debug("onSubscriptionPage: On subscription page");

        // Check if we are already observing the page
        if (observer) {
          console.debug("onSubscriptionPage: Already observing page");
          return;
        } else {
          console.debug("onSubscriptionPage: Starting to observe page");
          observer = await watchSubscriptionPage();
        }
      } else {
        console.debug("onSubscriptionPage: Not on subscription page");
        if (observer) {
          console.debug("onSubscriptionPage: Stopping observer");
          observer.disconnect();
          observer = undefined;
        }
      }
    }
  }
);
