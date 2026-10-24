import { Listing, Enquiry, SavedListing } from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import { buildListingQuery } from "../utils/listingQuery.js";
import ApiError from "../utils/ApiError.js";
import { validateNewListing } from "../validators/listingValidator.js";

async function uploadImages(files = []) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return [];
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "ghardhundho" },
            (error, result) => {
              if (error) return reject(error);
              resolve({ url: result.secure_url, publicId: result.public_id });
            },
          );
          stream.end(file.buffer);
        }),
    ),
  );
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
  return Listing.create({
    ...body,
    owner: ownerId,
    rent: Number(body.rent),
    deposit: Number(body.deposit) || 0,
    amenities: Array.isArray(body.amenities)
      ? body.amenities
      : String(body.amenities || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    images: await uploadImages(files),
    isAvailable: body.isAvailable !== "false",
  });
}

/** Apply listing edits while enforcing owner ownership. */
export async function updateListing(id, ownerId, body, files) {
  const listing = await Listing.findById(id);
  if (!listing) throw new ApiError(404, "Listing not found");
  if (String(listing.owner) !== String(ownerId)) {
    throw new ApiError(403, "You do not have permission to update this listing");
  }
  const updates = { ...body };
  delete updates.removedImages;
  for (const key of ["rent", "deposit"])
    if (updates[key] !== undefined) updates[key] = Number(updates[key]);
  if (updates.amenities !== undefined) {
    updates.amenities = Array.isArray(updates.amenities)
      ? updates.amenities
      : updates.amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  }
  if (updates.isAvailable !== undefined)
    updates.isAvailable = updates.isAvailable === "true";
  let removedImages = [];
  if (body.removedImages) {
    try {
      removedImages = JSON.parse(body.removedImages);
      if (!Array.isArray(removedImages)) throw new Error("Expected an image URL list");
    } catch {
      throw new ApiError(400, "Invalid removed image list");
    }
  }
  const retainedImages = listing.images.filter(
    (image) => !removedImages.includes(image.url),
  );
  if (retainedImages.length + (files?.length || 0) > 6)
    throw new ApiError(400, "You can add up to 6 images in total.");
  if (removedImages.length) {
    const removed = listing.images.filter((image) => removedImages.includes(image.url));
    await Promise.all(
      removed
        .filter((image) => image.publicId)
        .map((image) => cloudinary.uploader.destroy(image.publicId).catch(() => {})),
    );
  }
  if (body.removedImages !== undefined || files?.length)
    updates.images = [...retainedImages, ...(await uploadImages(files))];
  Object.assign(listing, updates);
  await listing.save();
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
    if (image.publicId) await cloudinary.uploader.destroy(image.publicId).catch(() => {});
  await Promise.all([
    listing.deleteOne(),
    Enquiry.deleteMany({ listing: listing._id }),
    SavedListing.deleteMany({ listing: listing._id }),
  ]);
}
