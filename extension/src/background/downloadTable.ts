import { LookupTable } from "../common/parent_types";

const downloadTable = async (): Promise<LookupTable | void> => {
  let response;
  try {
    console.debug("background.js: downloading lookup table");

    response = await fetch(
      `https://table.oenu.org/neb-table/lookup_table.json`
    );
    // Check response
    if (response.status === 204) {
      console.debug("downloadTable: no new table");
      return;
    } else if (response.status === 200) {
      const data = await response.json();
      return data as LookupTable;
    }
  } catch (error) {
    console.debug(error);
    return;
  }
};

export default downloadTable;
