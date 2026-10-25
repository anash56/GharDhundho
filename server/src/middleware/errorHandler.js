import { apiError } from "../utils/ApiResponse.js";
import { env } from "../config/env.js";

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let status = Number.isInteger(error.status) ? error.status : undefined;
  let message = error.message;

  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON request body.";
  } else if (error.code === "LIMIT_FILE_SIZE") {
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
  } else if (error.name === "MulterError") {
    status = 400;
    message = "The uploaded files or form fields are invalid.";
  }

  if (!status) status = 500;

  if (status >= 500) {
    // Do not log request bodies, cookies, tokens, credentials, error stacks, or provider payloads.
    console.error("[api-error]", {
      name: typeof error.name === "string" ? error.name : "Error",
      method: req.method,
      path: req.originalUrl?.split("?")[0],
    });
    if (env.isProduction) message = "Internal server error";
  }

  if (env.isProduction && status >= 500) {
    message = "Internal server error";
  } else if (!message || status >= 500) {
    message = "Server error";
  }

  res.status(status).json(apiError(message));
}
