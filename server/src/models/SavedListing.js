import mongoose from "mongoose";
const { Schema, model } = mongoose;
const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
  },
  { timestamps: true },
);
schema.index({ user: 1, listing: 1 }, { unique: true });
export const SavedListing = model("SavedListing", schema);
export default SavedListing;
