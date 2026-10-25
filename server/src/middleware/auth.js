import { User } from "../models/User.js";
import { verifyToken } from "../utils/token.js";
import ApiError from "../utils/ApiError.js";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

function tokenFromRequest(req) {
  return (
    req.cookies?.token ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "")
  );
}

async function loadCurrentUser(token) {
  const payload = verifyToken(token);
  if (typeof payload?.id !== "string" || !OBJECT_ID_PATTERN.test(payload.id)) {
    throw new ApiError(401, "Session is invalid. Please sign in again.");
  }

  const user = await User.findById(payload.id).select("_id role");
  if (!user) {
    throw new ApiError(401, "Your account no longer exists. Please sign in again.");
  }

  // Authorization always uses the current database role, never the token's role claim.
  return { id: String(user._id), role: user.role };
}

export async function auth(req, res, next) {
  try {
    const token = tokenFromRequest(req);
    if (!token) throw new ApiError(401, "Please sign in");
    req.user = await loadCurrentUser(token);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication for public listing reads. An expired/invalid cookie
 * does not block browsing, but it never grants the authenticated phone projection.
 */
export async function optionalAuth(req, res, next) {
  const token = tokenFromRequest(req);
  if (!token) return next();

  try {
    req.user = await loadCurrentUser(token);
  } catch (error) {
    if (error.status === 401) {
      req.user = undefined;
      return next();
    }
    return next(error);
  }

  return next();
}
