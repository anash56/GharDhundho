import { Enquiry, Listing } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import {
  validateEnquiryListingId,
  validateEnquiryMessage,
  validateEnquiryStatus,
} from "../validators/enquiryValidator.js";

/** Create a seeker message for an available listing; allow only one open enquiry per seeker/listing. */
export async function createEnquiry(seekerId, input = {}) {
  validateEnquiryListingId(input.listingId);
  validateEnquiryMessage(input.message);

  const listing = await Listing.findById(input.listingId);
  if (!listing || !listing.isAvailable) throw new ApiError(404, "Listing is unavailable");

  const existingOpenEnquiry = await Enquiry.findOne({
    listing: listing._id,
    seeker: seekerId,
    status: { $in: ["new", "contacted"] },
  });
  if (existingOpenEnquiry) {
    throw new ApiError(409, "You already have an open enquiry for this listing.");
  }

  return Enquiry.create({
    listing: listing._id,
    seeker: seekerId,
    owner: listing.owner,
    message: input.message.trim(),
  });
}

/** Load enquiries assigned to an owner. */
export function getReceivedEnquiries(ownerId) {
  return Enquiry.find({ owner: ownerId })
    .populate("listing", "title city locality")
    .populate("seeker", "name email phone")
    .sort({ createdAt: -1 });
}

/** Load enquiries sent by a seeker. The owner phone is available only in this enquiry context. */
export function getSentEnquiries(seekerId) {
  return Enquiry.find({ seeker: seekerId })
    .populate("listing", "title city locality images rent")
    .populate("owner", "name phone")
    .sort({ createdAt: -1 });
}

/** Update an enquiry status for its listing owner. */
export async function updateEnquiryStatus(id, ownerId, status) {
  validateEnquiryStatus(status);
  const enquiry = await Enquiry.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { status },
    { new: true, runValidators: true },
  );
  if (!enquiry) throw new ApiError(404, "Enquiry not found");
  return enquiry;
}
