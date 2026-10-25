import { SavedListing, Listing } from "../models/index.js";
import ApiError from "../utils/ApiError.js";

/** Return saved listings with their owner summary. */
export function getSavedListings(userId) {
  return SavedListing.find({ user: userId })
    .populate({ path: "listing", populate: { path: "owner", select: "name isVerified" } })
    .sort({ createdAt: -1 });
}

/** Save a listing once per user; report whether this request created the record. */
export async function saveListing(userId, listingId) {
  if (!(await Listing.exists({ _id: listingId }))) {
    throw new ApiError(404, "Listing not found");
  }

  const query = { user: userId, listing: listingId };
  const existing = await SavedListing.findOne(query);
  if (existing) return { listing: existing, created: false };

  try {
    const listing = await SavedListing.create(query);
    return { listing, created: true };
  } catch (error) {
    // The unique index protects concurrent requests for the same save.
    if (error.code === 11000) {
      const existingAfterRace = await SavedListing.findOne(query);
      if (existingAfterRace) return { listing: existingAfterRace, created: false };
    }
    throw error;
  }
}

/** Remove a user's saved listing. */
export function removeSavedListing(userId, listingId) {
  return SavedListing.deleteOne({ user: userId, listing: listingId });
}
