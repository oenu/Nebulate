import "dotenv/config";
import express from "express";
const app = express();
const cors = require("cors");
app.use(cors());

// Constants
const port = process.env.PORT || 3000;

// Types
declare global {
  var token: string;
  var key: string;
}

// Mongoose
import mongoose from "mongoose";
import { connectDB } from "./config/dbConfig";
connectDB();

// Middleware
import logger from "./config/logger";
import auth from "./middleware/auth";
import globalInit from "./store/store";

app.use(auth);

// Routes

const serveLookupTable = require("./routes/serveTable");
app.use("/api/table", serveLookupTable);

const scrapeNebula = require("./routes/scrapeNebula");
app.use("/scrape/nebula", scrapeNebula);

const scrapeYoutube = require("./routes/scrapeYoutube");
app.use("/scrape/youtube", scrapeYoutube);

const registerChannel = require("./routes/registerChannel");
app.use("/register", registerChannel);

const matchVideos = require("./routes/matchVideos");
app.use("/match", matchVideos);

const lookupRequest = require("./routes/lookupRequest");
app.use("/api/lookup", lookupRequest);

const registerAllCreators = require("./routes/registerAllCreators");
app.use("/register_all_serious", registerAllCreators);

const matchAllCreators = require("./routes/matchAllCreators");
app.use("/match_all_serious", matchAllCreators);

// Start the server
mongoose.connection.once("open", async () => {
  // Initialize global variables
  await globalInit();
  logger.info("Connected to MongoDB");
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
});
