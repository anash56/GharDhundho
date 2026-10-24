import * as service from "../services/enquiryService.js";
import { apiResponse } from "../utils/ApiResponse.js";
export async function create(req, res) {
  res
    .status(201)
    .json(
      apiResponse("Enquiry sent", await service.createEnquiry(req.user.id, req.body)),
    );
}
export async function received(req, res) {
  res.json(
    apiResponse("Received enquiries", await service.getReceivedEnquiries(req.user.id)),
  );
}
export async function sent(req, res) {
  res.json(apiResponse("Sent enquiries", await service.getSentEnquiries(req.user.id)));
}
export async function updateStatus(req, res) {
  res.json(
    apiResponse(
      "Status updated",
      await service.updateEnquiryStatus(req.params.id, req.user.id, req.body.status),
    ),
  );
}
