// Express server

// Imports
import express from "express";
const app = express();
import "dotenv/config";
import type { Response } from "express";

// Set the port
const port = process.env.PORT || 3000;

// Mongoose
import mongoose from "mongoose";
import { connectDB } from "./config/dbConfig";
connectDB();

// Middleware
import logger from "./config/logger";

// Routes
app.get("/", (_req, res: Response) => {
  res.send("Hello World!");
  logger.info("Hello World!");
});

// Start the server
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  // logger.info("Connected to MongoDB");
});
