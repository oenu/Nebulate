import { defaults } from "../../common/defaults";
import { updateTable } from "../table/updateTable";

chrome.runtime.onStartup.addListener(async function () {
  try {
    // Check if the extension is in development mode
    const devMode =
      (await chrome.management.getSelf()).installType === "development";

    // If the extension is in development mode, update the lookup table
    if (devMode) {
      await updateTable();
    } else {
      // On startup in production, check if the lookup table needs to be updated
      const lastUpdated = await chrome.storage.local.get("lastUpdated");
      const lastUpdatedDate = new Date(lastUpdated.lastUpdated);
      const now = new Date();

      // If the lookup table has never been fetched, fetch it
      if (lastUpdated.lastUpdated === undefined) {
        await updateTable();
      } else {
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
