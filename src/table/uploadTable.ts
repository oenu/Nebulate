import generateTable from "./generateTable";
import logger from "../utils/logger";
import AWS from "aws-sdk";
import fs = require("fs");
import path = require("path");
// Use AWS S3 to upload the table to cloudflare R2 CDN
const uploadTable = async () => {
  // Check that env variables are set
  if (!process.env.ACCESS_KEY_ID) {
    throw new Error("ACCESS_KEY_ID not set");
  }
  if (!process.env.SECRET_ACCESS_KEY) {
    throw new Error("SECRET_ACCESS_KEY not set");
  }

  // Create S3 client
  const s3 = new AWS.S3({
    endpoint:
      "https://97ba6ee2b2da3d74d5ab72746d725e97.r2.cloudflarestorage.com/neb-table",
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

  const lookupTablePath = path.join(__dirname, "/lookup_table.json");
  if (!fs.existsSync(lookupTablePath)) {
    logger.warn(
      "uploadTable: lookup table does not exist, generating new table"
    );
    await generateTable();
  }

  // Read the lookup table
  const lookupTable = fs.readFileSync(lookupTablePath, "utf8");

  // Upload the lookup table to cloudflare R2 CDN
  const params = {
    Bucket: "neb-table",
    Key: "lookup_table.json",
    Body: lookupTable,
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
