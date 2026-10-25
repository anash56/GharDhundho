import { apiError } from "../utils/ApiResponse.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = error.status;
  let message = error.message;

  if (error.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "Each image must be 5 MB or smaller.";
  } else if (error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE") {
    status = 400;
    message = "You can add up to 6 images in total.";
  } else if (error.name === "CastError") {
    status = 400;
    message = "Invalid id format";
  } else if (error.name === "ValidationError") {
    status = 400;
    message = "Validation failed. Check the submitted fields.";
  } else if (error.code === 11000) {
    status = 409;
    message = "A record with this value already exists.";
  }

  if (!status) status = error.name === "MulterError" ? 400 : 500;
  if (status >= 500) console.error(error);
  res.status(status).json(apiError(message || "Server error"));
}
