import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { validateRegistration } from "../validators/authValidator.js";

// Generated once per process so unknown emails still incur a bcrypt comparison.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("ghardhundho-timing-protection-only", 12);

/** Validate, hash, and register an owner or seeker account. */
export async function registerAccount(input = {}) {
  validateRegistration(input);

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const { password, role } = input;

  if (await User.exists({ email })) {
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

/** Compare against a real or dummy bcrypt hash, without revealing whether email exists. */
export async function authenticateAccount(input = {}) {
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  const usableEmail = email.length > 0 && email.length <= 254;

  const user = usableEmail
    ? await User.findOne({ email }).select("+password")
    : null;

  const hash = user?.password || DUMMY_PASSWORD_HASH;
  const passwordMatches = await bcrypt.compare(password, hash);

  if (!user || !passwordMatches) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  return user;
}

/** Find the authenticated account by its database id. */
export function getAccount(userId) {
  return User.findById(userId);
}
