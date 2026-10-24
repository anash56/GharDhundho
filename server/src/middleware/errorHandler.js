import { apiError } from "../utils/ApiResponse.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === "LIMIT_FILE_SIZE")
    error.message = "Each image must be 5 MB or smaller.";
  if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE")
    error.message = "You can add up to 6 images in total.";
  const status = error.status || (error.name === "MulterError" ? 400 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json(apiError(error.message || "Server error"));
}
