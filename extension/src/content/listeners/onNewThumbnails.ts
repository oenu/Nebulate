console.log("onNewPage: Loaded listener");
import { pageTypes } from "../handlers/pageWatchers/pageOptions";
// // on new page, detect which type of page it is and start watching it

import { Messages } from "../../common/enums";
import { getOptions } from "../../common/options";
import { watchPage } from "../handlers/pageWatchers/watchPage";
// import { watchPage } from "../handlers/pageWatchers/watchPage";

let observer:
  | {
      // eslint-disable-next-line no-undef
      MutationObserver: MutationObserver;
      pageType: keyof typeof pageTypes;
    }
  | undefined;

// Listen for the background script to tell us a new page has loaded
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === Messages.URL_UPDATE) {
    // Detect which type of page it is and start watching it

    const options = await getOptions();
    console.log("got options", options);

    let page: keyof typeof pageTypes | undefined;
    // Home
    // eslint-disable-next-line no-undef
    if (window.location.href === "https://www.youtube.com/") {
      console.debug("onNewPage: Detected home page");
      page = "home";
      if (!options.homeShow.value) {
        console.log("homePage: Options are set to not show on home page");
        return;
      }
      await checkObserver(observer, page);
    }
    // Channel
    else if (
      // eslint-disable-next-line no-undef
      window.location.href.match(
        /^https:\/\/www\.youtube\.com\/(@[a-zA-Z0-9]+\/featured|@[a-zA-Z0-9]+\/videos|@[a-zA-Z0-9]+|c\/[a-zA-Z0-9]+|user\/[a-zA-Z0-9]+)$/
      )
    ) {
      console.debug("onNewPage: Detected channel page");
      page = "channel";
      // if (!options.channelShow.value) {
      // console.log("channelPage: Options are set to not show on channel page");
      // return;
      // } else {
      await checkObserver(observer, page);
    }
    // }
    // Video
    else if (
      // eslint-disable-next-line no-undef
      window.location.href.match(/^https:\/\/www\.youtube\.com\/watch\?v=/)
    ) {
      console.debug("onNewPage: Detected video page");
      page = "video";
      // if (!options.videoShow.value) {
      // console.log("videoPage: Options are set to not show on video page");
      // return;
      // } else {
      await checkObserver(observer, page);
      // }
    }
    // Search
    else if (
      // eslint-disable-next-line no-undef
      window.location.href.match(
        /^https:\/\/www\.youtube\.com\/results\?search_query=/
      )
    ) {
      console.debug("onNewPage: Detected search page");
      page = "search";
      // if (!options.searchShow.value) {
      // console.log("searchPage: Options are set to not show on search page");
      // return;
      // } else {
      await checkObserver(observer, page);
      // }
    }
    // Subscriptions
    else if (
      // eslint-disable-next-line no-undef
      window.location.href.match(
        /^https:\/\/www\.youtube\.com\/feed\/subscriptions/
      )
    ) {
      console.debug("onNewPage: Detected subscriptions page");
      page = "subscriptions";
      if (!options.subscriptionsShow.value) {
        console.log(
          "subscriptionsPage: Options are set to not show on subscriptions page"
        );
        return;
      }
      await checkObserver(observer, page);
    } else {
      console.log("onNewPage: Unknown page type");
      return;
    }

    console.log("onNewPage: Detected page type: ", page);
    console.log("onNewPage: observer", observer);
    // Check if options are set to show on this page

    // Convert page to pageOptions

    // }
    console.debug(`onNewPage: Received message: `, message);

    // Check if we are already observing the page
    //   if (observer) {
    //     if (observer.pageType === page) {
    //       console.debug(`onNewPage: Already observing ${page} page`);
    //       return;
    //     } else {
    //       console.debug(
    //         `onNewPage: Stopping observer for ${observer.pageType} page`
    //       );
    //       observer.MutationObserver.disconnect();
    //       observer = {
    //         MutationObserver: await watchPage(page),
    //         pageType: page,
    //       };
    //     }
    //   } else {
    //     console.debug(`onNewPage: Starting to observe ${page} page`);
    //     observer = {
    //       MutationObserver: await watchPage(page),
    //       pageType: page,
    //     };
    //   }
  }
});

const checkObserver = async (
  observer:
    | {
        // eslint-disable-next-line no-undef
        MutationObserver: MutationObserver;
        pageType: keyof typeof pageTypes;
      }
    | undefined,
  page: keyof typeof pageTypes
): Promise<void> => {
  if (observer) {
    if (observer.pageType === page) {
      console.debug(`onNewPage: Already observing ${page} page`);
      return;
    } else {
      console.debug(
        `onNewPage: Stopping observer for ${observer.pageType} page`
      );
      observer.MutationObserver.disconnect();
      observer = {
        MutationObserver: await watchPage(page),
        pageType: page,
      };
    }
  } else {
    console.debug(`onNewPage: Starting to observe ${page} page`);
    observer = {
      MutationObserver: await watchPage(page),
      pageType: page,
    };
  }
};
