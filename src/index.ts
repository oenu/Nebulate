import "dotenv/config";
import express from "express";
const app = express();
const cors = require("cors");
app.use(cors());

// Rate Limiting
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Constants
const port = process.env.PORT || 3000;

// Types
declare global {
  var token: string;
  var key: string;
}

// Mongoose
import mongoose from "mongoose";
import { connectDB } from "./utils/dbConfig";
connectDB();

// Middleware
import logger from "./utils/logger";
import auth from "./middleware/refreshAuth";
import globalInit from "./auth/init";

import { reqAuth } from "./middleware/reqAuth";

app.use(auth);

// Routes
// Respond to request for latest version of the lookup table
// const serveLookupTable = require("./routes/serveTable");
// app.use("/api/table", serveLookupTable);

// Trigger a scrape of nebula videos for specific creator
const scrapeNebula = require("./routes/scrapeNebula");
app.use("/scrape/nebula", reqAuth, scrapeNebula);

// Trigger a scrape of youtube videos for specific creator
const scrapeYoutube = require("./routes/scrapeYoutube");
app.use("/scrape/youtube", reqAuth, scrapeYoutube);

// Register a new creator
const register = require("./routes/register");
app.use("/register", reqAuth, register);

// Match videos from Nebula and Youtube for specific creator
const match = require("./routes/match");
app.use("/match", reqAuth, match);

// Search internal mappings for a specific nebula video based on a provided youtube video id
const lookup = require("./routes/lookup");
app.use("/api/lookup", lookup);

// Trigger the registration of all creators that have manual youtube id mappings
const registerAll = require("./routes/registerAll");
app.use("/register_all", reqAuth, registerAll);

// Match all videos from Nebula and Youtube for all creators without scraping new videos
const matchAll = require("./routes/matchAll");
app.use("/match_all", reqAuth, matchAll);

// Trigger a scrape of all creators and rematching of all videos
const updateAll = require("./routes/updateAll");
app.use("/update_all_creators", reqAuth, updateAll);

// Start the server
mongoose.connection.once("open", async () => {
  // Initialize global variables
  await globalInit();
  logger.info("Connected to MongoDB");
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
});
