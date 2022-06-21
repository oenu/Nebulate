//Imports
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "../config/logger";

export const keyFromNebula = async (): Promise<string> => {
  try {
    const response = await axios.post(
      "https://api.watchnebula.com/api/v1/auth/login/",
      {
        email: process.env.SCRAPE_USER,
        password: process.env.SCRAPE_PASS,
      }
    );
    logger.info("Key from Nebula");
    await fs.promises.writeFile(
      path.join(__dirname, "..", "store", "simple_key.txt"),
      response.data.key,
      "utf-8"
    );

    global.key = response.data.key;
    return response.data.key;
  } catch (error) {
    logger.error(error);
    logger.error("Key: Unable to get key from Nebula");
    throw new Error("Key: Unable to get key from Nebula");
  }
};

export default keyFromNebula;
