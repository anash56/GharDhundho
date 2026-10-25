import ApiError from "../utils/ApiError.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function validateEnquiryListingId(listingId) {
  if (typeof listingId !== "string" || !OBJECT_ID_PATTERN.test(listingId)) {
    throw new ApiError(400, "Invalid listing id format.");
  }
}

export function validateEnquiryMessage(message) {
  if (typeof message !== "string" || !message.trim()) {
    throw new ApiError(400, "Write a message for the owner");
  }
  if (message.trim().length > 2000) {
    throw new ApiError(400, "Enquiry messages must be 2000 characters or fewer.");
  }
}

export function validateEnquiryStatus(status) {
  if (!["new", "contacted", "closed"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }
}
