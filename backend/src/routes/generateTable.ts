import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import generateTable from "../table/generateTable";

app.put("/", async (_req: Request, res: Response) => {
  logger.warn("generateTable: Generating table");
  try {
    await generateTable();
    res.send("Generated table");
    return;
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
    return;
  }
});

module.exports = app;
