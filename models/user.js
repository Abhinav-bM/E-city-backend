import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String, required: true, unique: true },
    email: { type: String, unique: true, lowercase: true },
  },
  { timestamps: true }
);

const USER = mongoose.model("user", userSchema, "user");
export default USER;