//Imports
import axios from "axios";
import fs from "fs";
import path from "path";
import logger from "../config/logger";
import keyFromNebula from "./keyFromNebula";

export const jwtFromNebula = async (): Promise<string> => {
  try {
    if (global.key === undefined) {
      try {
        logger.info("Global key undefined, fetching from file");
        const simple_key = await fs.promises.readFile(
          path.join(__dirname, "..", "store", "simple_key.txt"),
          "utf-8"
        );
        global.key = simple_key;
      } catch {
        logger.error("No key found in store, fetching from Nebula");
        try {
          await keyFromNebula();
          // global token should be set
        } catch (error) {
          throw error;
        }
        if (global.key === undefined) {
          throw new Error("Fallback method: keyFromNebula failed to set key");
        }
      }
    }

    const url = "https://api.watchnebula.com/api/v1/authorization/";
    const response = await axios.post(url, {
      data: { Authorization: `Token ${global.key}` },
    });

    await fs.promises.writeFile(
      path.join(__dirname, "..", "store", "json_token.txt"),
      response.data.token
    );

    global.token = response.data.token;
    return response.data.token;
  } catch (error) {
    logger.error(error);
    logger.error("JWT: Unable to get token from Nebula");
    throw new Error("JWT: Unable to get token from Nebula");
  }
};

export default jwtFromNebula;
