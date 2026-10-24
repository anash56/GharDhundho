/** Wrap successful endpoint data in the stable API response envelope. */
export function apiResponse(message, data) {
  return { success: true, message, data };
}

/** Wrap an endpoint error in the stable API response envelope. */
export function apiError(message) {
  return { success: false, message, data: null };
}
