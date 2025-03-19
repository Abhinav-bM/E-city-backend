import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    phoneNumber: { type: String, required: true, unique: true },
    role: { type: String, enum: ["Admin", "User"], default: "User" },
    email: { type: String, unique: true, lowercase: true },
  },
  { versionKey: false }
);

const USER = mongoose.model("user", userSchema, "user");
export default USER;
