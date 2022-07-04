import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import updateAll from "../batch/updateAll";

app.put("/", async (_req: Request, res: Response) => {
  logger.warn("updateAll: Updating all channels");
  updateAll();
  res.send("Updating all channels");
});

module.exports = app;
