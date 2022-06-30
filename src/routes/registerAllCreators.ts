import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import registerAllCreators from "../bulk_methods/registerAllCreators";

app.post("/", async (_req: Request, res: Response) => {
  logger.warn("registerAllCreators: Registering all creators");
  registerAllCreators();
  res.send("Registering all creators");
});

module.exports = app;
