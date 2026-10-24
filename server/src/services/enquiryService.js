import { Enquiry, Listing } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import {
  validateEnquiryMessage,
  validateEnquiryStatus,
} from "../validators/enquiryValidator.js";

/** Create a seeker message for an available listing. */
export async function createEnquiry(seekerId, input) {
  const listing = await Listing.findById(input.listingId);
  if (!listing || !listing.isAvailable) throw new ApiError(404, "Listing is unavailable");
  validateEnquiryMessage(input.message);
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
/** Load enquiries sent by a seeker. */
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
    { new: true },
  );
  if (!enquiry) throw new ApiError(404, "Enquiry not found");
  return enquiry;
}
