import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import matchVideosCron from "../bulk_methods/matchAllCreators";

app.post("/", async (_req: Request, res: Response) => {
  logger.warn("matchAllCreators: Matching all creators");
  matchVideosCron();
  res.send("Matching all creators");
});

module.exports = app;
