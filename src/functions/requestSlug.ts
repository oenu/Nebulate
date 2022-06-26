import { server_url } from "../background";

const requestSlug = async (youtube_id: string) => {
  try {
    console.log("background.js: requesting slug");
    const response = await fetch(`${server_url}/api/lookup/${youtube_id}`);
    console.log(response);
    const data = await response.text();
    console.log("background.js: received slug: " + data);
    return data;
  } catch (error) {
    console.log(error);
    return;
  }
};

export default requestSlug;
