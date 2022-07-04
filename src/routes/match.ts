import logger from "../utils/logger";
import express from "express";
import type { Response, Request } from "express";
const app = express();

import match from "../channel/match";

app.put("/:channelSlug", async (req: Request, res: Response) => {
  const channelSlug = req.params.channelSlug;

  if (!channelSlug) {
    res.send("No channelSlug provided");
    logger.error("No channelSlug provided");
    return;
  }
  try {
    await match(channelSlug);

    res.send(`Matched ${channelSlug}`);
  } catch (error: any) {
    logger.error(error.message);
    throw error;
  }
});

module.exports = app;
