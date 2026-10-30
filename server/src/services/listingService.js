import { Listing, Enquiry, SavedListing } from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { buildListingQuery } from "../utils/listingQuery.js";
import ApiError from "../utils/ApiError.js";
import {
  validateNewListing,
  validateListingUpdates,
} from "../validators/listingValidator.js";

async function uploadSingleImage(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "ghardhundho", resource_type: "image" },
      (error, uploadResult) => {
        if (error) return reject(error);
        if (!uploadResult?.secure_url || !uploadResult?.public_id) {
          return reject(new Error("Cloudinary returned incomplete upload metadata."));
        }
        resolve({ url: uploadResult.secure_url, publicId: uploadResult.public_id });
      },
    );
    stream.end(file.buffer);
  });
}

/** Upload up to six images concurrently; clean up every successful upload if any fail. */
async function uploadImages(files = []) {
  if (!files.length) return [];
  if (!env.cloudinaryCloudName) {
    throw new ApiError(503, "Image uploads are not configured on this server.");
  }

  const results = await Promise.allSettled(files.map((file) => uploadSingleImage(file)));
  const uploaded = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const failedUploads = results.filter((result) => result.status === "rejected").length;

  if (failedUploads > 0) {
    const cleanupResults = await Promise.allSettled(
      uploaded.map((image) => cloudinary.uploader.destroy(image.publicId)),
    );
    const cleanupFailures = cleanupResults.filter((result) => result.status === "rejected").length;

    console.error("[cloudinary-upload]", {
      failedUploads,
      cleanupFailures,
    });
    throw new ApiError(502, "One or more images could not be uploaded. Please try again.");
  }

  return uploaded;
}

function normalizeAmenities(value) {
  if (Array.isArray(value)) return value.map((item) => item.trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBoolean(value) {
  if (value === undefined) return undefined;
  return value === true || value === "true";
}

/** Search available listings without exposing owner phone numbers. */
export async function findListings(query) {
  const { filter, sortOrder, currentPage, pageSize } = buildListingQuery(query);
  const ownerFields = "name isVerified";
  const [items, total] = await Promise.all([
    Listing.find(filter)
      .populate("owner", ownerFields)
      .sort(sortOrder)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Listing.countDocuments(filter),
  ]);
  return { items, total, page: currentPage, pages: Math.ceil(total / pageSize) };
}

export async function findListingById(id) {
  const ownerFields = "name isVerified";
  const listing = await Listing.findById(id).populate("owner", ownerFields);
  if (!listing) throw new ApiError(404, "Listing not found");
  return listing;
}

/** Find every listing created by an owner, newest first. */
export function findOwnerListings(ownerId) {
  return Listing.find({ owner: ownerId }).sort({ createdAt: -1 });
}

/** Validate and persist a new owner listing and its uploaded images. */
export async function createListing(ownerId, body, files) {
  validateNewListing(body);
  const images = await uploadImages(files || []);
  try {
    return await Listing.create({
      owner: ownerId,
      title: body.title.trim(),
      description: body.description.trim(),
      city: body.city.trim(),
      locality: body.locality.trim(),
      ...(body.address ? { address: body.address.trim() } : {}),
      propertyType: body.propertyType,
      rent: Number(body.rent),
      deposit: body.deposit === undefined || body.deposit === "" ? 0 : Number(body.deposit),
      availableFor: body.availableFor || "anyone",
      furnishing: body.furnishing || "unfurnished",
      amenities: normalizeAmenities(body.amenities),
      images,
      isAvailable: normalizeBoolean(body.isAvailable) ?? true,
    });
  } catch (error) {
    await Promise.allSettled(
      images.map((image) => cloudinary.uploader.destroy(image.publicId)),
    );
    throw error;
  }
}

/** Apply only validated, explicitly permitted edits while enforcing ownership. */
export async function updateListing(id, ownerId, body, files) {
  validateListingUpdates(body);
  const listing = await Listing.findById(id);
  if (!listing) throw new ApiError(404, "Listing not found");
  if (String(listing.owner) !== String(ownerId)) {
    throw new ApiError(403, "You do not have permission to update this listing");
  }

  let removedImages = [];
  if (body.removedImages !== undefined && body.removedImages !== "") {
    removedImages =
      typeof body.removedImages === "string"
        ? JSON.parse(body.removedImages)
        : body.removedImages;
  }
  const removed = listing.images.filter((image) => removedImages.includes(image.url));
  const retainedImages = listing.images.filter((image) => !removedImages.includes(image.url));
  if (retainedImages.length + (files?.length || 0) > 6) {
    throw new ApiError(400, "You can add up to 6 images in total.");
  }

  const newImages = await uploadImages(files || []);
  const updates = {};
  for (const field of [
    "title",
    "description",
    "city",
    "locality",
    "address",
    "propertyType",
    "availableFor",
    "furnishing",
  ]) {
    if (body[field] !== undefined) updates[field] = body[field].trim();
  }
  if (body.address === "") updates.address = undefined;
  if (body.rent !== undefined) updates.rent = Number(body.rent);
  if (body.deposit !== undefined) updates.deposit = Number(body.deposit);
  if (body.amenities !== undefined) updates.amenities = normalizeAmenities(body.amenities);
  if (body.isAvailable !== undefined) updates.isAvailable = normalizeBoolean(body.isAvailable);
  if (body.removedImages !== undefined || (files?.length || 0) > 0) {
    updates.images = [...retainedImages, ...newImages];
  }

  try {
    Object.assign(listing, updates);
    await listing.save();
  } catch (error) {
    await Promise.allSettled(
      newImages.map((image) => cloudinary.uploader.destroy(image.publicId)),
    );
    throw error;
  }

  const cleanupResults = await Promise.allSettled(
    removed
      .filter((image) => image.publicId)
      .map((image) => cloudinary.uploader.destroy(image.publicId)),
  );
  const failedCleanupCount = cleanupResults.filter((result) => result.status === "rejected").length;
  if (failedCleanupCount > 0) {
    console.error("[cloudinary-cleanup]", { failedCleanupCount });
  }

  return listing;
}

/** Delete a listing and its dependent data, plus hosted photos. */
export async function deleteListing(id, user) {
  const filter = user.role === "admin" ? { _id: id } : { _id: id, owner: user.id };
  const listing = await Listing.findOne(filter);
  if (!listing) {
    if (user.role !== "admin" && (await Listing.exists({ _id: id }))) {
      throw new ApiError(403, "You do not have permission to delete this listing");
    }
    throw new ApiError(404, "Listing not found");
  }

  await Enquiry.deleteMany({ listing: listing._id });
  await SavedListing.deleteMany({ listing: listing._id });
  await listing.deleteOne();

  const cleanupResults = await Promise.allSettled(
    listing.images
      .filter((image) => image.publicId)
      .map((image) => cloudinary.uploader.destroy(image.publicId)),
  );
  const failedCleanupCount = cleanupResults.filter((result) => result.status === "rejected").length;
  if (failedCleanupCount > 0) {
    console.error("[cloudinary-cleanup]", { failedCleanupCount });
  }
}
