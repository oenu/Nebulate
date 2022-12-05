import { Messages } from "../../common/enums";
import { getOptions } from "../../common/options";
import { watchPage } from "../handlers/pageWatchers/watchHomePage";
// import watchHomePage from "../handlers/pageWatchers/watchHomePage";

// eslint-disable-next-line no-undef
let observer: MutationObserver | undefined;

// Listen for the background script to tell us we are on a home page
chrome.runtime.onMessage.addListener(
  async (
    message
    // _sender, sendResponse
  ) => {
    if (message.type === Messages.URL_UPDATE) {
      const options = await getOptions();
      if (!options.homeShow.value) {
        console.log("onHomePage: Disabled");
        return;
      }
      console.debug("onHomePage: Received message: ", message);

      // Home page is just youtube.com
      // eslint-disable-next-line no-undef
      if (window.location.href === "https://www.youtube.com/") {
        console.debug("onHomePage: On home page");

        // Check if options are set to show on home page
        if (!options.homeShow) {
          console.debug("onHomePage: Options are set to not show on home page");
          return;
        }

        // Check if we are already observing the page
        if (observer) {
          console.debug("onHomePage: Already observing page");
          return;
        } else {
          console.debug("onHomePage: Starting to observe page");
          // observer = await watchHomePage();
          observer = await watchPage("home");
        }
      } else {
        console.debug("onHomePage: Not on home page");
        if (observer) {
          console.debug("onHomePage: Stopping observer");
          observer.disconnect();
          observer = undefined;
        }
      }
    }
  }
);
