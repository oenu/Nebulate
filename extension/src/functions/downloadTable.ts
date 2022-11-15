import { server_url } from "../background";

const downloadTable = async (): Promise<any> => {
  let response;
  try {
    console.debug("background.js: downloading lookup table");

    // Check for existing table
    const table = await chrome.storage.local.get("lookupTable");

    response = await fetch(
      `https://table.oenu.org/neb-table/lookup_table.json`
    );
    // Check response
    if (response.status === 204) {
      console.debug("background.js: table is up to date");
      return;
    } else if (response.status === 200) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.debug(error);
    return;
  }
};

export default downloadTable;
