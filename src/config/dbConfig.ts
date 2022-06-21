import mongoose from "mongoose";

// Fix undefined ENV typing
declare let process: { env: { [key: string]: string } };

export const connectDB = async () => {
  try {
    if (process.env.DATABASE_URI) {
      await mongoose.connect(process.env.DATABASE_URI);
    } else {
      throw new Error("DATABASE_URI is not defined");
    }
  } catch (err) {
    console.error(err);
  }
};
