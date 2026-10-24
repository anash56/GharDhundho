import { Listing, Enquiry, SavedListing } from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import { buildListingQuery } from "../utils/listingQuery.js";
import ApiError from "../utils/ApiError.js";
import {
  validateNewListing,
  validateListingUpdates,
} from "../validators/listingValidator.js";

async function uploadImages(files = []) {
  if (!files.length) return [];
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new ApiError(503, "Image uploads are not configured on this server.");
  }
  const uploaded = [];
  try {
    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "ghardhundho", resource_type: "image" },
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          },
        );
        stream.end(file.buffer);
      });
      uploaded.push({ url: result.secure_url, publicId: result.public_id });
    }
    return uploaded;
  } catch {
    await Promise.all(
      uploaded.map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => { })),
    );
    throw new ApiError(502, "One or more images could not be uploaded. Please try again.");
  }
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

/** Search available listings and return the existing paginated result shape. */
export async function findListings(query) {
  const { filter, sortOrder, currentPage, pageSize } = buildListingQuery(query);
  const [items, total] = await Promise.all([
    Listing.find(filter)
      .populate("owner", "name isVerified phone")
      .sort(sortOrder)
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize),
    Listing.countDocuments(filter),
  ]);
  return { items, total, page: currentPage, pages: Math.ceil(total / pageSize) };
}

export async function findListingById(id) {
  const listing = await Listing.findById(id).populate("owner", "name phone isVerified");
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
    await Promise.all(
      images.map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => { })),
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
    await Promise.all(
      newImages.map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => { })),
    );
    throw error;
  }

  await Promise.all(
    removed
      .filter((image) => image.publicId)
      .map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => { })),
  );
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
  for (const image of listing.images)
    if (image.publicId) await cloudinary.uploader.destroy(image.publicId).catch(() => { });
  await Promise.all([
    listing.deleteOne(),
    Enquiry.deleteMany({ listing: listing._id }),
    SavedListing.deleteMany({ listing: listing._id }),
  ]);
}
