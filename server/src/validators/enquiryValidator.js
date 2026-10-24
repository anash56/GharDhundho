import ApiError from "../utils/ApiError.js";

export function validateEnquiryMessage(message) {
  if (!message?.trim()) throw new ApiError(400, "Write a message for the owner");
}

export function validateEnquiryStatus(status) {
  if (!["new", "contacted", "closed"].includes(status))
    throw new ApiError(400, "Invalid status");
}
