import { updateTable } from "../table/updateTable";

chrome.runtime.onInstalled.addListener(async function () {
  try {
    const devMode =
      (await chrome.management.getSelf()).installType === "development";
    chrome.storage.local.set({ devMode });

    await updateTable();
  } catch (e) {
    console.log("BG: Error in chrome.runtime.onInstalled.addListener: ", e);
  }
});
