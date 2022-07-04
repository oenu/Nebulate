import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import updateAll from "../batch/updateAll";

app.put("/", async (_req: Request, res: Response) => {
  logger.warn("updateAll: Updating all creators");
  updateAll();
  res.send("Updating all creators");
});

module.exports = app;
