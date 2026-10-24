import { SavedListing, Listing } from "../models/index.js";
import ApiError from "../utils/ApiError.js";

/** Return saved listings with their owner summary. */
export function getSavedListings(userId) {
  return SavedListing.find({ user: userId })
    .populate({ path: "listing", populate: { path: "owner", select: "name isVerified" } })
    .sort({ createdAt: -1 });
}
/** Save a listing once per user. */
export async function saveListing(userId, listingId) {
  if (!(await Listing.exists({ _id: listingId })))
    throw new ApiError(404, "Listing not found");
  return SavedListing.findOneAndUpdate(
    { user: userId, listing: listingId },
    { user: userId, listing: listingId },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
/** Remove a user's saved listing. */
export function removeSavedListing(userId, listingId) {
  return SavedListing.deleteOne({ user: userId, listing: listingId });
}
