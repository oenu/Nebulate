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

  await match(channelSlug)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      res.status(400).send(err.message);
      logger.error(err.message);
    });
});

module.exports = app;
