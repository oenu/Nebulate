import logger from "../config/logger";
import path from "path";
import fs from "fs";

import jwtFromNebula from "../Functions/jwtFromNebula";
import keyFromNebula from "../Functions/keyFromNebula";
const globalInit = async () => {
  try {
    // Key Handler
    if (global.key === undefined) {
      try {
        const simple_key = await fs.promises.readFile(
          path.join(__dirname, ".", "simple_key.txt"),
          "utf-8"
        );

        if (typeof simple_key === undefined || simple_key.length === 0) {
          // Check if returned key is empty
          throw new Error("Init: Key is empty");
        } else {
          // Set key
          global.key = simple_key;
        }
      } catch (error: any) {
        // Most likely error here is that the file doesn't exist
        if (error.code === "ENOENT") {
          logger.error("Init: Key not found");
          // Call function that will fetch key from Nebula, write it to file and set global.key
          await keyFromNebula();
          logger.info("Init: Key fetched from Nebula");
        } else {
          logger.error("Init: Key fetching failed");
          throw new Error("Init: Key fetching failed");
        }
      }
    }

    // Token Handler
    if (global.token === undefined) {
      try {
        const json_token = await fs.promises.readFile(
          path.join(__dirname, ".", "json_token.txt"),
          "utf-8"
        );
        if (typeof json_token === undefined || json_token.length === 0) {
          // Check if returned token is empty
          logger.info("Init: Token is empty");
        } else {
          // Set token
          global.token = json_token;
        }
      } catch (error: any) {
        // Most likely error here is that the file doesn't exist
        if (error.code === "ENOENT") {
          logger.error("Init: Token not found");
          // Call function that will fetch JWT from Nebula, write it to file and set global.token
          await jwtFromNebula();
          logger.info("Init: Token fetched from Nebula");
        } else {
          logger.error("Init: Token fetching failed");
          throw new Error("Init: Token fetching failed");
        }
      }
    }
    logger.info("Init: Global variables set");
  } catch (error) {
    logger.error(error);
    throw new Error("Init: Global init failed");
  }
};
export default globalInit;
