import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import registerAllCreators from "../bulk_methods/registerAllCreators";

app.put("/", async (_req: Request, res: Response) => {
  try {
    logger.warn("registerAllCreators: Registering all creators");
    registerAllCreators();
    res.send("Registering all creators");
  } catch (error) {
    logger.error(error);
    res.status(500).send(error);
  }
});

module.exports = app;
