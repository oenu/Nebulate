import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import registerAll from "../batch/registerAll";

app.put("/", async (_req: Request, res: Response) => {
  try {
    logger.warn("registerAll: Registering all creators");
    registerAll();
    res.send("Registering all creators");
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

module.exports = app;
