import * as service from "../services/listingService.js";
import { apiResponse } from "../utils/ApiResponse.js";
export async function list(req, res) {
  res.json(apiResponse("Listings", await service.findListings(req.query)));
}
export async function myListings(req, res) {
  res.json(apiResponse("Your listings", await service.findOwnerListings(req.user.id)));
}
export async function create(req, res) {
  res
    .status(201)
    .json(
      apiResponse(
        "Listing created",
        await service.createListing(req.user.id, req.body, req.files),
      ),
    );
}
export async function detail(req, res) {
  res.json(apiResponse("Listing details", await service.findListingById(req.params.id)));
}
export async function update(req, res) {
  res.json(
    apiResponse(
      "Listing updated",
      await service.updateListing(req.params.id, req.user.id, req.body, req.files),
    ),
  );
}
export async function remove(req, res) {
  await service.deleteListing(req.params.id, req.user);
  res.json(apiResponse("Listing deleted", null));
}
