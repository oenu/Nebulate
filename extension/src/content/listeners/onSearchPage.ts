// import { Messages } from "../../common/enums";
// import { getOptions } from "../../common/options";
// import { watchPage } from "../handlers/pageWatchers/watchPage";

// // eslint-disable-next-line no-undef
// let observer: MutationObserver | undefined;

// // Listen for the background script to tell us we are on a search page
// chrome.runtime.onMessage.addListener(
//   async (
//     message
//     // _sender, sendResponse
//   ) => {
//     if (message.type === Messages.URL_UPDATE) {
//       const options = await getOptions();

//       if (!options.searchShow.value) {
//         console.log("onSearchPage: Disabled");
//         return;
//       }

//       console.debug("onSearchPage: Received message: ", message);
//       // eslint-disable-next-line no-undef
//       if (window.location.href.includes("youtube.com/results")) {
//         console.debug("onSearchPage: On search page");

//         // Check if we are already observing the page
//         if (observer) {
//           console.debug("onSearchPage: Already observing page");
//           return;
//         } else {
//           console.debug("onSearchPage: Starting to observe page");
//           observer = await watchPage("search");
//         }
//       } else {
//         console.debug("onSearchPage: Not on search page");
//         if (observer) {
//           console.debug("onSearchPage: Stopping observer");
//           observer.disconnect();
//           observer = undefined;
//         }
//       }
//     }
//   }
// );
