import mongoose from "mongoose";
const { Schema, model } = mongoose;
const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["owner", "seeker", "admin"], required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);
export const User = model("User", schema);
export default User;
