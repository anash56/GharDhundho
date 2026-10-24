import api from "./api.js";

export const listingService = {
  list: (params) =>
    api.get("/listings", { params }).then((response) => response.data.data),
  get: (id) => api.get(`/listings/${id}`),
  mine: () => api.get("/listings/my").then((response) => response.data.data),
  create: (body) =>
    api.post("/listings", body, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, body) =>
    api.put(`/listings/${id}`, body, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => api.delete(`/listings/${id}`),
};
