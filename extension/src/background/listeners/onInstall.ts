import { updateTable } from "../table/updateTable";

/**
 * Listener Tasks:
 * 1. On first install, set default preferences
 * 1.1 Set pref for opening Nebula links in a new tab
 * 1.2 Set pref for showing the channel button
 * 1.3 Set pref for showing the video button
 * 1.4 Set pref for time to wait before refreshing the lookup table
 * 2. On first install, set whether the extension is in development mode
 * 3. On first install or update, trigger a refresh of the lookup table
 */
chrome.runtime.onInstalled.addListener(async function () {
  // 1.
  // Set default preferences
  try {
    // // 1.1
    // // Set pref for opening Nebula links in a new tab
    // const storage = await chrome.storage.sync.get("preferNewTab");
    // if (storage.preferNewTab === undefined) {
    //   chrome.storage.sync.set({ preferNewTab: defaults.preferNewTab });
    // }

    // // 1.2
    // // Set pref for showing the channel button
    // const showChannelButton = await chrome.storage.sync.get(
    //   "showChannelButton"
    // );
    // if (showChannelButton.showChannelButton === undefined) {
    //   chrome.storage.sync.set({
    //     showChannelButton: defaults.showChannelButton,
    //   });
    // }

    // // 1.3
    // // Set pref for showing the video button
    // const showVideoButton = await chrome.storage.sync.get("showVideoButton");
    // if (showVideoButton.showVideoButton === undefined) {
    //   chrome.storage.sync.set({ showVideoButton: defaults.showVideoButton });
    // }

    // // 1.4
    // // Set pref for time to wait before refreshing the lookup table
    // const updateInterval = await chrome.storage.sync.get("updateInterval");
    // if (updateInterval.updateInterval === undefined) {
    //   chrome.storage.sync.set({ updateInterval: defaults.updateInterval });
    // }

    // 2
    // Set whether the extension is in development mode
    const devMode =
      (await chrome.management.getSelf()).installType === "development";
    chrome.storage.local.set({ devMode });

    // 3
    // Trigger a refresh of the lookup table
    await updateTable();
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onInstalled.addListener: ", e);
  }
});
