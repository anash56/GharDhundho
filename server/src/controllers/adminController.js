import * as service from "../services/adminService.js";
import { apiResponse } from "../utils/ApiResponse.js";

export async function overview(req, res) {
  res.json(apiResponse("Admin overview", await service.getAdminOverview()));
}

export async function listings(req, res) {
  res.json(apiResponse("Listings for moderation", await service.getAdminListings(req.query)));
}

export async function moderateListing(req, res) {
  const listing = await service.moderateListing(req.params.id, req.user.id, req.body);
  res.json(apiResponse("Listing moderation updated", listing));
}
