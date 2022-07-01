//Imports
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

/**
 * @function keyFromNebula
 * @description This function fetches a secret from Nebula using a username and password stored in the environment at NEBULA_USERNAME and NEBULA_PASSWORD.
 * @description This stores the secret in a file in the /store directory and sets the global.key to the secret.
 * @returns {Promise<string>} A promise that resolves to a secret from Nebula.
 * @throws {Error} If the secret cannot be requested from Nebula or if environment variables are not set.
 * @async
 */

export const keyFromNebula = async (): Promise<string> => {
  if (
    process.env.NEBULA_USERNAME === undefined ||
    process.env.NEBULA_PASSWORD === undefined
  ) {
    throw new Error("keyFromNebula: Environment variables not set");
  }
  try {
    // Request secret from Nebula
    const response = await axios.post(
      "https://api.watchnebula.com/api/v1/auth/login/",
      {
        email: process.env.NEBULA_USERNAME,
        password: process.env.NEBULA_PASSWORD,
      }
    );
    logger.debug("keyFromNebula: Key fetched from Nebula");

    // Write secret to file
    await fs.promises.writeFile(
      path.join(__dirname, "..", "/store", "simple_key.txt"),
      response.data.key,
      "utf-8"
    );

    // Set global.key to secret
    global.key = response.data.key;
    return response.data.key;
  } catch (error) {
    logger.error(error);
    throw new Error("keyFromNebula: Unable to get key from Nebula");
  }
};

export default keyFromNebula;
