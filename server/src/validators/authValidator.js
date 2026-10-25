import ApiError from "../utils/ApiError.js";

export function validateRegistration(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(400, "Registration data must be an object.");
  }

  const { name, email, phone, password, role } = input;
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof phone !== "string" ||
    typeof password !== "string" ||
    typeof role !== "string" ||
    !name.trim() ||
    name.trim().length > 100 ||
    !email.trim() ||
    email.trim().length > 254 ||
    !phone.trim() ||
    password.length < 8 ||
    password.length > 128 ||
    !["owner", "seeker"].includes(role)
  ) {
    throw new ApiError(400, "Enter valid fields and a password between 8 and 128 characters.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError(400, "Enter a valid email address");
  }

  if (!/^\+?[\d\s()-]{8,20}$/.test(phone.trim())) {
    throw new ApiError(400, "Enter a valid phone number");
  }
}
