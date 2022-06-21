//Imports
import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * Key from Nebula
 * Queries the Nebula API for a new token and writes it to a file.
 * @param {string} simple_key
 * @returns {Promise<void>}
 */
export const keyFromNebula = async (): Promise<string | undefined> => {
  await axios
    .post("https://api.watchnebula.com/api/v1/auth/login/", {
      email: process.env.SCRAPE_USER,
      password: process.env.SCRAPE_PASS,
    })
    .then((response) => {
      fs.promises
        .writeFile(
          path.join(__dirname, "..", "database", "simple_key.txt"),
          response.data.key,
          "utf-8"
        )
        .then(() => {
          Promise.resolve(response.data.key);
        });
    })
    .catch((err) => {
      console.log(err);
      Promise.resolve(undefined);
    });
  return;
};
