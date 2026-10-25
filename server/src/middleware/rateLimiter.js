import rateLimit from "express-rate-limit";
import { apiError } from "../utils/ApiResponse.js";

function createLimiter({ windowMs, limit, message }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(apiError(message));
    },
  });
}

export const authRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  message: "Too many authentication attempts. Please try again later.",
});

export const apiRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: "Too many API requests. Please try again later.",
});

export const listingUploadRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many listing uploads. Please wait before trying again.",
});

export const enquiryRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many enquiries. Please try again later.",
});
