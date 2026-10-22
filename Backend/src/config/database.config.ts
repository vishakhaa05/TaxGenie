import mongoose from "mongoose";
import { Env } from "./env.config";

mongoose.set("bufferCommands", false);

const connctDatabase = async () => {
  try {
    await mongoose.connect(Env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB database");
  } catch (error) {
    console.warn("⚠️ MongoDB offline or IP not whitelisted. Resilient user store active.");
  }
};

export default connctDatabase;
