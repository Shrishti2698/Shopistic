// creating a function "connectDB", which will allow us to connect to the database
import mongoose from "mongoose";
import dotenv from "dotenv";

export const connectDB = async () => {
    try{
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`mongoDB connected: ${conn.connection.host}`);
      
    }
    catch (error) { 
      console.log("Error connecting to MONGODB", error.message);
      process.exit(1); // 1 means failure. 0 means success!
      
    }
}