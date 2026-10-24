import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { validateRegistration } from "../validators/authValidator.js";

/** Validate, hash, and register an owner or seeker account. */
export async function registerAccount(input) {
  validateRegistration(input);
  const { name, email, phone, password, role } = input;
  if (await User.exists({ email: email.toLowerCase() })) {
    throw new ApiError(409, "Email is already registered");
  }
  return User.create({
    name,
    email,
    phone,
    password: await bcrypt.hash(password, 12),
    role,
  });
}

/** Verify credentials without returning the stored password. */
export async function authenticateAccount(input) {
  const user = await User.findOne({
    email: String(input.email || "").toLowerCase(),
  }).select("+password");
  if (!user || !(await bcrypt.compare(input.password || "", user.password))) {
    throw new ApiError(401, "Email or password is incorrect");
  }
  return user;
}

/** Find the authenticated account by its database id. */
export function getAccount(userId) {
  return User.findById(userId);
}
