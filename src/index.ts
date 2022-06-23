import express, { Request } from "express";
const app = express();
import type { Response } from "express";
import "dotenv/config";

// Constants
const port = process.env.PORT || 3000;

// Types
declare global {
  var token: string;
  var key: string;
}

// Token store initialization

// Mongoose
import mongoose from "mongoose";
import { connectDB } from "./config/dbConfig";
connectDB();

// Middleware
import logger from "./config/logger";
import auth from "./middleware/auth";
import globalInit from "./store/store";
import videosFromNebula from "./Functions/videosFromNebula";
import registerCreatorInDB from "./Functions/registerCreatorInDB";
import videosFromYoutube from "./Functions/videosFromYoutube";
app.use(auth);

// Routes
app.get("/", (_req, res: Response) => {
  res.send("Hello World!");
  logger.info("Hello World!");
});

app.get(
  "/update/:channel_slug/:onlySearchNew?/:searchLimit?",
  async (req: Request, res: Response) => {
    const { channel_slug } = req.params;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const searchLimit = req.params.searchLimit
      ? parseInt(req.params.searchLimit)
      : 10;

    if (!channel_slug) {
      res.send("No channel_slug provided");
      logger.error("No channel_slug provided");
      return;
    }

    logger.info(`Updating ${channel_slug}`);

    try {
      await videosFromNebula(channel_slug, onlySearchNew, searchLimit);
    } catch (error) {
      logger.error(error);
    }
    res.send(`Updating ${channel_slug}`);
  }
);

app.get("/register/:channel_slug", async (req: Request, res: Response) => {
  // TODO: Change to post
  const { channel_slug } = req.params;

  if (!channel_slug) {
    res.send("No channel_slug provided");
    logger.error("No channel_slug provided");
    return;
  }

  try {
    await registerCreatorInDB(channel_slug);
    res.send(`Registered ${channel_slug}`);
  } catch (error: any) {
    logger.error(error.message);

    if (error.message) {
      res.send(error.message);
    } else {
      res.send(error);
    }
  }
});

app.get(
  "/youtube/:channel_slug/:onlySearchNew?/:videoScrapeLimit?",
  async (req: Request, res: Response) => {
    const channel_slug = req.params.channel_slug;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const videoScrapeLimit = req.params.videoScrapeLimit
      ? parseInt(req.params.videoScrapeLimit)
      : 10;

    if (!channel_slug) {
      res.send("No channel_slug provided");
      logger.error("No channel_slug provided");
      return;
    }

    try {
      await videosFromYoutube(channel_slug, onlySearchNew, videoScrapeLimit);
      res.send(`Scraped ${channel_slug}`);
    } catch (error: any) {
      logger.error(error.message);

      if (error.message) {
        res.send(error.message);
      } else {
        res.send(error);
      }
    }
  }
);

// Start the server
mongoose.connection.once("open", async () => {
  // Initialize global variables
  await globalInit();
  logger.info("Connected to MongoDB");
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
});
