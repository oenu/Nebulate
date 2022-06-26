import { server_url } from "../background";

const downloadTable = async (): Promise<any> => {
  try {
    console.log("background.js: downloading lookup table");
    const response = await fetch(`${server_url}/api/table`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return;
  }
};

export default downloadTable;
