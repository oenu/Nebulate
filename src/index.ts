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
  "/update/:creatorSlug/:onlySearchNew?/:searchLimit?",
  async (req: Request, res: Response) => {
    const { creatorSlug } = req.params;
    const onlySearchNew = req.params.onlySearchNew
      ? req.params.onlySearchNew === "true"
      : true;
    const searchLimit = req.params.searchLimit
      ? parseInt(req.params.searchLimit)
      : 10;

    if (!creatorSlug) {
      res.send("No creator slug provided");
      logger.error("No creator slug provided");
      return;
    }

    logger.info(`Updating ${creatorSlug}`);

    try {
      await videosFromNebula(creatorSlug, onlySearchNew, searchLimit);
    } catch (error) {
      logger.error(error);
    }
    res.send(`Updating ${creatorSlug}`);
  }
);

app.get("/register/:creatorSlug", async (req: Request, res: Response) => {
  // TODO: Change to post
  const { creatorSlug } = req.params;

  if (!creatorSlug) {
    res.send("No creator slug provided");
    logger.error("No creator slug provided");
    return;
  }

  try {
    await registerCreatorInDB(creatorSlug);
    res.send(`Registered ${creatorSlug}`);
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
  "/youtube/:creatorSlug/:videoScrapeLimit?",
  async (req: Request, res: Response) => {
    const creatorSlug = req.params.creatorSlug;
    const videoScrapeLimit = req.params.videoScrapeLimit
      ? parseInt(req.params.videoScrapeLimit)
      : 10;

    if (!creatorSlug) {
      res.send("No creator slug provided");
      logger.error("No creator slug provided");
      return;
    }

    try {
      await videosFromYoutube(creatorSlug, videoScrapeLimit);
      res.send(`Scraped ${creatorSlug}`);
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
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  logger.info("Connected to MongoDB");
});
