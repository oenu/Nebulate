import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import uploadTable from "../table/uploadTable";

app.put("/", async (_req: Request, res: Response) => {
  logger.warn("uploadTable: Uploading table");
  try {
    await uploadTable();
    res.send("Uploaded table");
    return;
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
    return;
  }
});

module.exports = app;
