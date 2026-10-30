import mongoose from "mongoose";
const { Schema, model } = mongoose;
const schema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    city: { type: String, required: true, index: true },
    locality: { type: String, required: true },
    address: String,
    propertyType: { type: String, enum: ["room", "flat", "pg"], required: true },
    rent: { type: Number, required: true, min: 0 },
    deposit: { type: Number, default: 0 },
    availableFor: {
      type: String,
      enum: ["boys", "girls", "family", "anyone"],
      default: "anyone",
    },
    furnishing: {
      type: String,
      enum: ["furnished", "semi", "unfurnished"],
      default: "unfurnished",
    },
    amenities: [String],
    images: [{ url: String, publicId: String }],
    isAvailable: { type: Boolean, default: true },
    // Admin moderation is separate from the owner's availability setting.
    isHiddenByAdmin: { type: Boolean, default: false, index: true },
    adminModerationNote: { type: String, trim: true, maxlength: 500, default: "" },
    adminModeratedAt: { type: Date, default: null },
    adminModeratedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);
export const Listing = model("Listing", schema);
export default Listing;
