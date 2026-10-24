import jwt from "jsonwebtoken";
import ApiError from "./ApiError.js";

/** Sign a seven-day JWT for the authenticated account. */
export function createToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

/** Verify a JWT and translate invalid tokens to an API error. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Session expired. Please sign in again.");
  }
}

/** Remove private credentials from an account before responding. */
export function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
  };
}
