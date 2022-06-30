//Imports
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "../utils/logger";
import keyFromNebula from "./keyFromNebula";

/**
 * @function jwtFromNebula
 * @description This function fetches a JWT from Nebula using a secret provided by {@link keyFromNebula}, stores it in /store and sets global.token to it.
 * @description This function reads the secret from a file in the /store directory and will call {@link keyFromNebula} to get the secret if it does not exist.
 * @returns {Promise<string>} A promise that resolves to a JWT string.
 * @throws {Error} If the JWT cannot be resolved from Nebula or if the secret cannot be fetched from Nebula.
 * @memberof module:Auth
 * @async
 */

export const jwtFromNebula = async (): Promise<string> => {
  try {
    if (global.key === undefined) {
      // Fetch key from File
      try {
        logger.debug("jwtFromNebula: Global key undefined, fetching from file");
        const simple_key = await fs.promises.readFile(
          path.join(__dirname, "..", "/store", "simple_key.txt"),
          "utf-8"
        );
        global.key = simple_key;
      } catch {
        logger.error(
          "jwtFromNebula: No key found in store, fetching from Nebula"
        );
        await keyFromNebula();
        if (global.key === undefined) {
          throw new Error(
            "jwtFromNebula: Fallback method: keyFromNebula failed to set key"
          );
        }
      }
    }

    // Fetch JWT from Nebula
    const url = "https://api.watchnebula.com/api/v1/authorization/";
    const response = await axios.post(url, {
      data: { Authorization: `Token ${global.key}` },
    });

    // Write JWT to file
    await fs.promises.writeFile(
      path.join(__dirname, "..", "/store", "json_token.txt"),
      response.data.token
    );

    // Set global.token to JWT
    global.token = response.data.token;
    return response.data.token;
  } catch (error) {
    logger.error("JWT: Unable to get token from Nebula");
    throw new Error("JWT: Unable to get token from Nebula");
  }
};

export default jwtFromNebula;
