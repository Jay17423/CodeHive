import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
  console.log(process.env.MongoDb);

  await mongoose.connect(process.env.MongoDb);
};

export default connectDB;
