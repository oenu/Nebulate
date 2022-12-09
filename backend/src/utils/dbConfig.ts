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
export const connectDB = async (): Promise<void> => {
  try {
    // Connect to the database in development environment
    if (process.env.NODE_ENV === "dev") {
      logger.info("Connecting to mongoDB in dev mode");
      logger.warn("WARNING: YOU SHOULD HAVE MONGODB RUNNING LOCALLY");
      await mongoose.connect("mongodb://localhost:27017/development");

      // Connect to the database in production environment
    } else if (process.env.NODE_ENV === "prod") {
      if (process.env.DATABASE_URI === undefined) {
        throw new Error("connectDB: Environment variables not set");
      }
      // Attempt to connect to the database
      let i = 0;
      while (i < 10) {
        try {
          logger.info("Connecting to mongoDB in prod mode");
          await mongoose.connect(process.env.DATABASE_URI);
          break;
        } catch (error) {
          i++;
          logger.info(
            "Couldn't connect to mongoDB, retrying in 15 seconds, attempt " +
              i +
              "/10"
          );
          await new Promise((resolve) => setTimeout(resolve, 15000));
        }
      }
      // If the database connection fails 10 times, throw an error
      if (i === 10) {
        throw new Error("Couldn't connect to mongoDB after 10 attempts");
      }
    } else {
      throw new Error("connectDB: Environment variable NODE_ENV not set");
    }
  } catch (err) {
    console.error(err);
  }
};
