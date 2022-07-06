import { server_url } from "../background";

const requestSlug = async (youtube_id: string) => {
  try {
    console.debug("background.js: requesting slug");
    const response = await fetch(`${server_url}/api/lookup/${youtube_id}`);
    console.debug(response);
    const data = await response.text();
    console.debug("background.js: received slug: " + data);
    return data;
  } catch (error) {
    console.debug(error);
    return;
  }
};

export default requestSlug;
