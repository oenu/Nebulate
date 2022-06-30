import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import updateAllCreators from "../bulk_methods/updateAllCreators";

app.post("/", async (_req: Request, res: Response) => {
  logger.warn("updateAllCreators: Updating all creators");
  updateAllCreators();
  res.send("Updating all creators");
});

module.exports = app;
