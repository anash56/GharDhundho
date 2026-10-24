import * as service from "../services/savedService.js";
import { apiResponse } from "../utils/ApiResponse.js";
export async function list(req, res) {
  res.json(apiResponse("Saved listings", await service.getSavedListings(req.user.id)));
}
export async function save(req, res) {
  res
    .status(201)
    .json(
      apiResponse(
        "Listing saved",
        await service.saveListing(req.user.id, req.params.listingId),
      ),
    );
}
export async function remove(req, res) {
  await service.removeSavedListing(req.user.id, req.params.listingId);
  res.json(apiResponse("Listing removed from saved", null));
}
