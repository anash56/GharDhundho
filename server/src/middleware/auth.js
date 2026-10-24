import { verifyToken } from "../utils/token.js";
import ApiError from "../utils/ApiError.js";

export function auth(req, res, next) {
  try {
    const token =
      req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) throw new ApiError(401, "Please sign in");
    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
