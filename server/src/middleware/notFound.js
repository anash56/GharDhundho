import { apiError } from "../utils/ApiResponse.js";

export function notFound(req, res) {
  res.status(404).json(apiError("Route not found"));
}
