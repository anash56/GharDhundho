import api from "./api.js";

export const savedService = {
  save: (id) => api.post(`/saved/${id}`),
  remove: (id) => api.delete(`/saved/${id}`),
  list: () => api.get("/saved"),
};
