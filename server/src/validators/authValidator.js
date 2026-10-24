import ApiError from "../utils/ApiError.js";

export function validateRegistration(input) {
  const { name, email, phone, password, role } = input;
  if (
    !name ||
    !email ||
    !phone ||
    !password ||
    password.length < 8 ||
    !["owner", "seeker"].includes(role)
  ) {
    throw new ApiError(400, "Enter all fields and a password with at least 8 characters");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Enter a valid email address");
  }
  if (!/^\+?[\d\s()-]{8,15}$/.test(phone)) {
    throw new ApiError(400, "Enter a valid phone number");
  }
}
