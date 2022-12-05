// console.log(`onNewPage: Loaded onNewPage.ts`);

// import { Messages } from "../../common/enums";
// import { getOptions } from "../../common/options";
// import { watchPage } from "../handlers/pageWatchers/watchPage";

// // eslint-disable-next-line no-undef
// let observer: MutationObserver | undefined;

// // Listen for the background script to tell us we are on a video page
// chrome.runtime.onMessage.addListener(
//   async (
//     message
//     // _sender, sendResponse
//   ) => {
//     if (message.type === Messages.URL_UPDATE) {
//       const options = await getOptions();
//       if (!options.videoShow.value) {
//         console.log("onVideoPage: Disabled");
//         return;
//       }

//       console.debug("onVideoPage: Received message: ", message);
//       // eslint-disable-next-line no-undef
//       if (window.location.href.includes("youtube.com/watch")) {
//         console.debug("onVideoPage: On video page");

//         // Check if we are already observing the page
//         if (observer) {
//           console.debug("onVideoPage: Already observing page");
//           return;
//         } else {
//           console.debug("onVideoPage: Starting to observe page");
//           observer = await watchPage("video");
//         }
//       } else {
//         console.debug("onVideoPage: Not on video page");
//         if (observer) {
//           console.debug("onVideoPage: Stopping observer");
//           observer.disconnect();
//           observer = undefined;
//         }
//       }
//     }
//   }
// );
