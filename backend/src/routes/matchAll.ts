import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import matchAll from "../batch/matchAll";

app.post("/", async (_req: Request, res: Response) => {
  logger.warn("matchAll: Matching all channels");
  matchAll();
  res.send("Matching all channels");
});

module.exports = app;
