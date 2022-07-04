import mongoose from "mongoose";
import logger from "./logger";
// Fix undefined ENV typing
declare let process: { env: { [key: string]: string } };

/**
 * @function connectDB
 * @description Connect to the mongoDB database using environment variable `process.env.DATABASE_URI`
 * @throws {Error} If the database connection fails
 * @async
 */
export const connectDB = async () => {
  try {
    console.log(process.env.NODE_ENV);
    // Connect to the database
    if (process.env.NODE_ENV === "dev") {
      logger.info("Connecting to mongoDB in dev mode");
      logger.warn("WARNING: YOU SHOULD HAVE MONGODB RUNNING LOCALLY");
      await mongoose.connect("mongodb://localhost:27017/nebulate");
    } else if (process.env.DATABASE_URI) {
      // Possibly first time, delay for a bit to allow mongodb to start
      logger.info("Waiting for mongodb to start");
      await new Promise((resolve) => setTimeout(resolve, 30000));
      logger.info("Connecting to mongoDB in prod mode");
      await mongoose.connect(process.env.DATABASE_URI);
    } else {
      // This cannot be missing, HCF
      throw new Error("DATABASE_URI is not defined");
    }
  } catch (err) {
    console.error(err);
  }
};
