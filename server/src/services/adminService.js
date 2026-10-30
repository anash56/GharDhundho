import mongoose from "mongoose";
import { Enquiry, Listing, User } from "../models/index.js";
import ApiError from "../utils/ApiError.js";

function positiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), maximum);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Return aggregate counts for the admin overview without exposing account records. */
export async function getAdminOverview() {
  const [totalUsers, owners, seekers, admins, totalListings, availableListings,
    hiddenListings, totalEnquiries, newEnquiries, contactedEnquiries, closedEnquiries] =
    await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "seeker" }),
      User.countDocuments({ role: "admin" }),
      Listing.countDocuments(),
      Listing.countDocuments({ isAvailable: true, isHiddenByAdmin: { $ne: true } }),
      Listing.countDocuments({ isHiddenByAdmin: true }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments({ status: "contacted" }),
      Enquiry.countDocuments({ status: "closed" }),
    ]);

  return {
    users: { total: totalUsers, owners, seekers, admins },
    listings: {
      total: totalListings,
      available: availableListings,
      hidden: hiddenListings,
      visible: totalListings - hiddenListings,
    },
    enquiries: {
      total: totalEnquiries,
      new: newEnquiries,
      contacted: contactedEnquiries,
      closed: closedEnquiries,
    },
  };
}

/** Paginated listing catalogue for admin review. */
export async function getAdminListings(query = {}) {
  const page = positiveInteger(query.page, 1, 1_000_000);
  const limit = positiveInteger(query.limit, 10, 50);
  const filter = {};

  if (query.status === "hidden") {
    filter.isHiddenByAdmin = true;
  } else if (query.status === "visible") {
    filter.isHiddenByAdmin = { $ne: true };
  } else if (query.status && query.status !== "all") {
    throw new ApiError(400, "Status must be all, visible, or hidden.");
  }

  const search = typeof query.search === "string" ? query.search.trim().slice(0, 80) : "";
  if (search) {
    const expression = new RegExp(escapeRegExp(search), "i");
    filter.$or = [
      { title: expression },
      { city: expression },
      { locality: expression },
    ];
  }

  const [items, total] = await Promise.all([
    Listing.find(filter)
      .populate("owner", "name email")
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Listing.countDocuments(filter),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit), pageSize: limit };
}

/** Hide or restore a listing without changing the owner's availability setting. */
export async function moderateListing(id, adminId, input = {}) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Listing id is invalid.");
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "A moderation request body is required.");
  }
  const allowedFields = new Set(["isHiddenByAdmin", "reason"]);
  if (Object.keys(input).some((field) => !allowedFields.has(field))) {
    throw new ApiError(400, "Only moderation status and reason can be updated.");
  }
  if (typeof input.isHiddenByAdmin !== "boolean") {
    throw new ApiError(400, "isHiddenByAdmin must be true or false.");
  }

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (input.isHiddenByAdmin && (reason.length < 8 || reason.length > 500)) {
    throw new ApiError(400, "Provide a moderation reason between 8 and 500 characters.");
  }
  if (!input.isHiddenByAdmin && reason.length > 500) {
    throw new ApiError(400, "The moderation reason cannot exceed 500 characters.");
  }

  const listing = await Listing.findById(id);
  if (!listing) throw new ApiError(404, "Listing not found.");

  listing.isHiddenByAdmin = input.isHiddenByAdmin;
  listing.adminModerationNote = input.isHiddenByAdmin ? reason : "";
  listing.adminModeratedAt = new Date();
  listing.adminModeratedBy = adminId;
  await listing.save();
  await listing.populate("owner", "name email");
  return listing;
}
