import "dotenv/config";
import express from "express";
const app = express();
const cors = require("cors");
app.use(cors());

// Rate Limiting
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
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
import auth from "./middleware/auth";
import globalInit from "./auth/store";
import { onlyLocal } from "./middleware/onlyLocal";

app.use(auth);

// Routes
// Respond to request for latest version of the lookup table
const serveLookupTable = require("./routes/serveTable");
app.use("/api/table", serveLookupTable);

// Trigger a scrape of nebula videos for specific creator
const scrapeNebula = require("./routes/scrapeNebula");
app.use("/scrape/nebula", onlyLocal, scrapeNebula);

// Trigger a scrape of youtube videos for specific creator
const scrapeYoutube = require("./routes/scrapeYoutube");
app.use("/scrape/youtube", onlyLocal, scrapeYoutube);

// Register a new creator
const registerChannel = require("./routes/registerChannel");
app.use("/register", onlyLocal, registerChannel);

// Match videos from Nebula and Youtube for specific creator
const matchVideos = require("./routes/matchVideos");
app.use("/match", onlyLocal, matchVideos);

// Search internal mappings for a specific nebula video based on a provided youtube video id
const lookupRequest = require("./routes/lookupRequest");
app.use("/api/lookup", lookupRequest);

// Trigger the registration of all creators that have manual youtube id mappings
const registerAllCreators = require("./routes/registerAllCreators");
app.use("/register_all_serious", onlyLocal, registerAllCreators);

// Match all videos from Nebula and Youtube for all creators without scraping new videos
const matchAllCreators = require("./routes/matchAllCreators");
app.use("/match_all_serious", onlyLocal, matchAllCreators);

// Trigger a scrape of all creators and rematching of all videos
const updateAllCreators = require("./routes/updateAllCreators");
app.use("/update_all_creators", onlyLocal, updateAllCreators);

// Start the server
mongoose.connection.once("open", async () => {
  // Initialize global variables
  await globalInit();
  logger.info("Connected to MongoDB");
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
});
