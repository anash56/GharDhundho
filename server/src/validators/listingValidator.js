import ApiError from "../utils/ApiError.js";

export function validateNewListing(body) {
  if (
    !body.title ||
    !body.description ||
    !body.city ||
    !body.locality ||
    !body.rent ||
    !body.propertyType
  ) {
    throw new ApiError(400, "Complete all required listing fields");
  }
}
