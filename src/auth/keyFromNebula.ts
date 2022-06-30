//Imports
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

/**
 * @function keyFromNebula
 * @description This function fetches a secret from Nebula using a username and password stored in the environment at SCRAPE_USER and SCRAPE_PASS.
 * @description This stores the secret in a file in the /store directory.
 * @returns {Promise<string>} A promise that resolves to a secret from Nebula
 * @throws {Error} If the secret cannot be requested from Nebula or if environment variables are not set
 * @async
 */

export const keyFromNebula = async (): Promise<string> => {
  if (
    process.env.SCRAPE_USER === undefined ||
    process.env.SCRAPE_PASS === undefined
  ) {
    throw new Error("keyFromNebula: Environment variables not set");
  }
  try {
    const response = await axios.post(
      "https://api.watchnebula.com/api/v1/auth/login/",
      {
        email: process.env.SCRAPE_USER,
        password: process.env.SCRAPE_PASS,
      }
    );
    logger.debug("keyFromNebula: Key fetched from Nebula");
    await fs.promises.writeFile(
      path.join(__dirname, "..", "/store", "simple_key.txt"),
      response.data.key,
      "utf-8"
    );

    global.key = response.data.key;
    return response.data.key;
  } catch (error) {
    logger.error(error);
    throw new Error("keyFromNebula: Unable to get key from Nebula");
  }
};

export default keyFromNebula;
