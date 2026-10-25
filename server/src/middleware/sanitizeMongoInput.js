import ApiError from "../utils/ApiError.js";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

/**
 * Reject operator/dotted keys in parsed query strings and bodies before they can
 * reach MongoDB. Query parsing is set to "simple" in app.js so bracket notation
 * remains visible as a literal key and can be rejected here.
 */
function assertSafeInput(value, depth = 0) {
  if (value === null || typeof value !== "object") return;

  if (depth > 12) {
    throw new ApiError(400, "Request data is nested too deeply.");
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      key.includes("$") ||
      key.includes(".") ||
      FORBIDDEN_KEYS.has(key)
    ) {
      throw new ApiError(400, "Request contains unsupported field names.");
    }

    assertSafeInput(nestedValue, depth + 1);
  }
}

export function sanitizeMongoInput(req, res, next) {
  try {
    assertSafeInput(req.query);
    assertSafeInput(req.body);
    next();
  } catch (error) {
    next(error);
  }
}
