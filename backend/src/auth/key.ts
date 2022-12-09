//Imports
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";

/**
 * @function getKey
 * @description This function fetches a secret from Nebula using a username and password stored in the environment at NEBULA_USERNAME and NEBULA_PASSWORD.
 * @description This stores the secret in a file in the /store directory and sets the global.key to the secret.
 * @returns {Promise<string>} A promise that resolves to a secret from Nebula.
 * @throws {Error} If the secret cannot be requested from Nebula or if environment variables are not set.
 * @async
 */

export const getKey = async (): Promise<string> => {
  if (
    process.env.NEBULA_USERNAME === undefined ||
    process.env.NEBULA_PASSWORD === undefined
  ) {
    throw new Error("getKey: Environment variables not set");
  } else {
    logger.info("getKey: Environment variables set");
  }
  try {
    // Request secret from Nebula
    logger.info("getKey: Requesting secret from Nebula");
    const response = await axios.post(
      "https://api.watchnebula.com/api/v1/auth/login/",
      {
        email: process.env.NEBULA_USERNAME,
        password: process.env.NEBULA_PASSWORD,
      }
    );
    logger.info("getKey: Key fetched from Nebula");

    // Check if folder exists
    const storePath = path.join(__dirname, "/store");
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath);
      logger.info("getKey: Created store folder");
    }

    // Write secret to file
    logger.info("getKey: Writing key to file");
    await fs.promises.writeFile(
      path.join(__dirname, "/store", "simple_key.txt"),
      response.data.key,
      "utf-8"
    );

    logger.info("getKey: Key written to file");
    // Set global.key to secret
    global.key = response.data.key;
    return response.data.key;
  } catch (error) {
    logger.error(error);
    throw new Error("getKey: Unable to get key from Nebula");
  }
};

export default getKey;
