import api from "./api.js";

export const enquiryService = {
  create: (body) => api.post("/enquiries", body),
  updateStatus: (id, status) => api.patch(`/enquiries/${id}/status`, { status }),
};
