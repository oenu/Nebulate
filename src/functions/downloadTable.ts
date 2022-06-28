import { server_url } from "../background";

const downloadTable = async (): Promise<any> => {
  let response;
  try {
    console.log("background.js: downloading lookup table");

    // Check for existing table
    const table = await chrome.storage.local.get("lookupTable");
    if (!table) {
      response = await fetch(`${server_url}/api/table`);
    } else {
      response = await fetch(`${server_url}/api/table/${table.lookupTable.id}`);
    }

    // Check response
    if (response.status === 204) {
      console.log("background.js: table is up to date");
      return;
    } else if (response.status === 200) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.log(error);
    return;
  }
};

export default downloadTable;
