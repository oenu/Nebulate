import logger from "../utils/logger";
import path from "path";
import fs from "fs";

import jwtFromNebula from "./jwtFromNebula";
import keyFromNebula from "./keyFromNebula";

/**
 * @function globalInit
 * @description This function initializes the global variables.
 * @
 * @returns {Promise<void>} A promise that resolves if the global variables are set
 * @throws {Error} If the global variables cannot be set
 * @async
 */

const globalInit = async () => {
  // Key Handler
  if (global.key === undefined) {
    try {
      const simple_key = await fs.promises.readFile(
        path.join(__dirname, "..", "/store", "simple_key.txt"),
        "utf-8"
      );

      // Check if returned key is empty
      if (typeof simple_key === undefined || simple_key.length === 0) {
        throw new Error("globalInit: Key is empty");
      } else {
        global.key = simple_key;
      }
    } catch (error: any) {
      // Most likely error here is that the file doesn't exist
      if (error.code === "ENOENT") {
        logger.error("globalInit: Key not found");
        // Call keyFromNebula to get key from Nebula
        await keyFromNebula();
      } else {
        throw new Error("globalInit: Secret Key fetching failed");
      }
    }
  }

  // Token Handler
  if (global.token === undefined) {
    try {
      const json_token = await fs.promises.readFile(
        path.join(__dirname, "..", "/store", "json_token.txt"),
        "utf-8"
      );

      // Check if returned token is empty
      if (typeof json_token === undefined || json_token.length === 0) {
        logger.info("globalInit: Token is empty");
      } else {
        global.token = json_token;
      }
    } catch (error: any) {
      // Most likely error here is that the file doesn't exist
      if (error.code === "ENOENT") {
        logger.error("globalInit: Token not found");
        // Call function that will fetch JWT from Nebula, write it to file and set global.token
        await jwtFromNebula();
      } else {
        throw new Error("globalInit: JWToken fetching failed");
      }
    }
  }
  logger.debug("globalInit: Global variables set");
};
export default globalInit;
