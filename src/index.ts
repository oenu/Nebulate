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
app.use(auth);

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
mongoose.connection.once("open", async () => {
  // Initialize global variables
  await globalInit();
  console.log("Connected to MongoDB");
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  logger.info("Connected to MongoDB");
});
