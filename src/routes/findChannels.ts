import { channelsFromNebula } from "../scrape/channelsFromNebula";
import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

app.put("/", async (_req: Request, res: Response) => {
  try {
    const result = await channelsFromNebula();
    res.send(result);
  } catch (error) {
    logger.error(error);
  }
});

module.exports = app;
