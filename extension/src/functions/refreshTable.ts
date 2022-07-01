import downloadTable from "./downloadTable";

export const refreshTable = async (): Promise<void> => {
  try {
    console.log("background.js: refreshing lookup table");
    const data = await downloadTable();
    if (data) {
      console.log("background.js: received lookup table, saving to storage");
      await chrome.storage.local.set({ lookupTable: data });
      await chrome.storage.local.set({ lastUpdated: new Date() });
    }
  } catch (error) {
    console.log(error);
  }
};
