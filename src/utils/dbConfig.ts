import mongoose from "mongoose";

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
    // Connect to the database
    if (process.env.DATABASE_URI) {
      await mongoose.connect(process.env.DATABASE_URI);
    } else {
      // This cannot be missing, HCF
      throw new Error("DATABASE_URI is not defined");
    }
  } catch (err) {
    console.error(err);
  }
};
