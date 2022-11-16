import generateTable from "./generateTable";
import type { LookupTable } from "./generateTable";
import logger from "../utils/logger";
import AWS from "aws-sdk";
import fs = require("fs");
import path = require("path");
import hash from "object-hash";
// Use AWS S3 to upload the table to cloudflare R2 CDN
const uploadTable = async () => {
  // Check that env variables are set
  if (!process.env.ACCESS_KEY_ID) {
    throw new Error("ACCESS_KEY_ID not set");
  }
  if (!process.env.SECRET_ACCESS_KEY) {
    throw new Error("SECRET_ACCESS_KEY not set");
  }
  if (!process.env.R2_ENDPOINT) {
    throw new Error("R2_ENDPOINT not set");
  }
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("R2_BUCKET_NAME not set");
  }
  if (!process.env.R2_TABLE_KEY) {
    throw new Error("R2_TABLE_KEY not set");
  }

  // Create S3 client
  const s3 = new AWS.S3({
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    signatureVersion: "v4",
  });

  // Check if S3 has connection
  try {
    await s3.listBuckets().promise();
  } catch (e) {
    logger.error("S3 connection failed");
    throw e;
  }

  // Get the table to upload
  const lookupTablePath = path.join(__dirname, "/lookup_table.json");

  // Check if the table exists - if it doesn't generate it
  if (!fs.existsSync(lookupTablePath)) {
    logger.warn(
      "uploadTable: lookup table does not exist, generating new table"
    );
    await generateTable();
  }

  // Read the lookup table
  const newTable = fs.readFileSync(lookupTablePath, "utf8");

  // Convert the lookup table to a JSON object
  const newTableObject: LookupTable = JSON.parse(newTable);

  // Hash the lookup table without the generatedAt property or the id property
  const newTableHash = hash(newTableObject, {
    excludeKeys: (key) => key === "generatedAt" || key === "id",
  });

  // Get the table from cloudflare
  const response = await s3
    .getObject({
      Bucket: "neb-table",
      Key: "lookup_table.json",
    })
    .promise();

  if (!response.Body) {
    throw new Error("No body in response");
  }

  // If the table exists, check if the hash is the same
  if (response.Body) {
    const existingTableObject: LookupTable = JSON.parse(
      response.Body.toString()
    );
    const existingTableHash = hash(existingTableObject, {
      excludeKeys: (key) => key === "generatedAt" || key === "id",
    });
    if (existingTableHash === newTableHash) {
      logger.info("uploadTable: Table is up to date");
      return;
    } else {
      logger.info("uploadTable: Table is out of date, updating table...");
    }
  }

  // Log the size of the table in bytes
  logger.info(
    `uploadTable: Uploading table with size ${Buffer.byteLength(
      newTable,
      "utf8"
    )} bytes`
  );

  // Upload the lookup table to cloudflare R2 CDN
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: process.env.R2_TABLE_KEY,
    Body: newTable,
  };

  s3.upload(params, function (err: Error, data: any) {
    if (err) {
      throw err;
    }
    logger.verbose(`uploadTable: ${data}`);
    logger.info(`uploadTable: upload successful ${data.Location}`);
  });
};

export default uploadTable;
