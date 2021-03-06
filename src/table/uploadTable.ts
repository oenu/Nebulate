import fs = require("fs");
import path = require("path");
import Base64 from "js-base64";
import crypto from "crypto";
import util from "util";
import { Octokit } from "octokit";
import logger from "../utils/logger";
import generateTable from "./generateTable";
// import { gzip, ungzip } from "node-gzip";

const uploadTable = async () => {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error("GITHUB_TOKEN is not defined");
  }
  if (process.env.GITHUB_REPO === undefined) {
    throw new Error("GITHUB_REPO is not defined");
  }
  if (process.env.GITHUB_USER === undefined) {
    throw new Error("GITHUB_USER is not defined");
  }
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const lookupTablePath = path.join(__dirname, "/lookup_table.json");

  if (!fs.existsSync(lookupTablePath)) {
    logger.warn(
      "uploadTable: lookup table does not exist, generating new table"
    );

    await generateTable();
  }

  const existingTable = JSON.parse(fs.readFileSync(lookupTablePath, "utf8"));

  const { encoded, hash } = formatForGithub(JSON.stringify(existingTable));

  // Get the current file
  const currentTable = await octokit.rest.repos.getContent({
    owner: process.env.GITHUB_USER,
    repo: process.env.GITHUB_REPO,
    path: "table.json",
  });
  logger.debug("Current table fetched");

  if ("content" in currentTable.data) {
    // Check if new table hashes match - sanity check
    if (currentTable.data.sha === hash) {
      logger.debug("No change");

      return;
    }

    // Update the table
    logger.debug("updating with new table");
    const newTable = await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_USER,
      repo: process.env.GITHUB_REPO,
      path: "table.json",
      message: "Update lookup table",
      content: encoded,
      sha: currentTable.data.sha,
    });

    if (newTable.status === 200) {
      logger.debug("Table updated");
      return;
    } else {
      throw new Error("Table update failed");
    }
  } else {
    // Create the table
    logger.debug("creating new table");
    const newTable = await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_USER,
      repo: process.env.GITHUB_REPO,
      path: "table.json",
      message: "Update lookup table",
      content: encoded,
    });

    if (newTable.status === 201) {
      return;
    } else {
      throw new Error("Failed to create table");
    }
  }
};
export default uploadTable;

const formatForGithub = (tableString: string) => {
  // Generate base64 encoded string for transmission
  const encoded = Base64.encode(tableString);

  // Get byte length of string
  const length = new util.TextEncoder().encode(tableString).length;
  // Combine with git properties to create SHA1
  const fullString = `blob ${length}\0` + tableString;
  const hash = crypto.createHash("sha1").update(fullString).digest("hex");
  return { encoded, hash };
};
