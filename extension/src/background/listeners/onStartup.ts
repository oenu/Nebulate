import { updateTable } from "../updateTable";

/**
 * Listener Tasks:
 * 1. On startup, check if the extension is in development mode
 * 1.1 If the extension is in development mode, update the lookup table
 * 2. On startup in production, check if the lookup table needs to be updated
 * 2.1 If the lookup table has never been fetched, fetch it
 * 2.2 If the lookup table is out of date, fetch it
 */
chrome.runtime.onStartup.addListener(async function () {
  try {
    // 1
    // Check if the extension is in development mode
    const devMode =
      (await chrome.management.getSelf()).installType === "development";

    // 1.1
    // If the extension is in development mode, update the lookup table
    if (devMode) {
      await updateTable();
    } else {
      // 2
      // On startup in production, check if the lookup table needs to be updated
      const lastUpdated = await chrome.storage.local.get("lastUpdated");
      const lastUpdatedDate = new Date(lastUpdated.lastUpdated);
      const now = new Date();

      // 2.1
      // If the lookup table has never been fetched, fetch it
      if (lastUpdated.lastUpdated === undefined) {
        await updateTable();
      } else {
        // 2.2
        // If the lookup table is out of date, fetch it
        const updateInterval = await chrome.storage.sync.get("updateInterval");
        const interval =
          updateInterval.updateInterval ?? defaults.updateInterval;
        if (now.getTime() - lastUpdatedDate.getTime() >= interval) {
          await updateTable();
        }
      }
    }
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onStartup.addListener: ", e);
  }
});
