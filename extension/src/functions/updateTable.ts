import downloadTable from "./downloadTable";

export const updateTable = async (): Promise<void> => {
  try {
    console.debug("background.js: refreshing lookup table");
    const data = await downloadTable();
    if (data) {
      console.debug("background.js: received lookup table, saving to storage");
      await chrome.storage.local.set({ lookupTable: data });
      await chrome.storage.local.set({ lastUpdate: new Date() });
    }
  } catch (error) {
    console.debug(error);
  }
};
