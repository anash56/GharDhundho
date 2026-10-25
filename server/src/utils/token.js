import jwt from "jsonwebtoken";
import ApiError from "./ApiError.js";
import { env } from "../config/env.js";

// Browser session JWTs are valid for 24 hours. The cookie uses the same lifetime.
export const TOKEN_TTL_SECONDS = 24 * 60 * 60;

export function createToken(user) {
  return jwt.sign(
    { id: String(user._id ?? user.id) },
    env.jwtSecret,
    { expiresIn: TOKEN_TTL_SECONDS },
  );
}

/** Verify signature, expiry, and age; this also rejects legacy seven-day sessions after 24 hours. */
export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const now = Math.floor(Date.now() / 1000);

    if (
      !payload ||
      typeof payload !== "object" ||
      !Number.isFinite(payload.iat) ||
      payload.iat > now + 60 ||
      now - payload.iat > TOKEN_TTL_SECONDS
    ) {
      throw new Error("Invalid token age");
    }

    return payload;
  } catch {
    throw new ApiError(401, "Session expired or invalid. Please sign in again.");
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
