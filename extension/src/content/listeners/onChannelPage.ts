// import { Messages } from "../../common/enums";
// import { getOptions } from "../../common/options";
// import { watchPage } from "../handlers/pageWatchers/watchPage";

// // eslint-disable-next-line no-undef
// let observer: MutationObserver | undefined;

// // Listen for the background script to tell us we are on a channel page
// chrome.runtime.onMessage.addListener(
//   async (
//     message
//     // _sender, sendResponse
//   ) => {
//     if (message.type === Messages.URL_UPDATE) {
//       const options = await getOptions();
//       if (!options.channelShow.value) {
//         console.log("onChannelPage: Disabled");
//         return;
//       }
//       console.debug("onChannelPage: Received message: ", message);

//       // Channel page is youtube.com/user/username or youtube.com/channel/channelId or youtube.com/c/username or youtube.com/@username
//       if (
//         // eslint-disable-next-line no-undef
//         window.location.href.match(
//           /^https:\/\/www\.youtube\.com\/(user|channel|c|@)\//
//         )
//       ) {
//         console.debug("onChannelPage: On channel page");

//         // Check if options are set to show on channel page
//         if (!options.channelShow) {
//           console.debug(
//             "onChannelPage: Options are set to not show on channel page"
//           );
//           return;
//         }

//         // Check if we are already observing the page
//         if (observer) {
//           console.debug("onChannelPage: Already observing page");
//           return;
//         } else {
//           console.debug("onChannelPage: Starting to observe page");
//           observer = await watchPage("channel");
//         }
//       }
//     }
//   }
// );
