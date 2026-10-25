
import rateLimit, { MemoryStore } from "express-rate-limit";
import { apiError } from "../utils/ApiResponse.js";

// Keep references to the stores so tests can reset their counters.
const limiterStores = [];

function createLimiter({ windowMs, limit, message }) {
  const store = new MemoryStore();

  const limiter = rateLimit({
    windowMs,
    limit,
    store,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(apiError(message));
    },
  });

  limiterStores.push(store);

  return limiter;
}

/**
 * Reset rate-limit counters between tests only.
 * This does not alter the configured rate limits.
 */
export async function resetRateLimitersForTests() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Rate-limit resets are only allowed in test mode.");
  }

  await Promise.all(
    limiterStores.map((store) => store.resetAll()),
  );
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
