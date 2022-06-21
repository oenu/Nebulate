import express, { Request } from "express";
const app = express();
import type { Response } from "express";
import "dotenv/config";

// Constants
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

app.get("/update/:creatorSlug", async (req: Request, res: Response) => {
  const { creatorSlug } = req.params;

  res.send(`Updating ${creatorSlug}`);
  logger.info(`Updating ${creatorSlug}`);
});

// Start the server
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  logger.info("Connected to MongoDB");
});
