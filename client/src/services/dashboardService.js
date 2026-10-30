import api from "./api.js";

export const dashboardService = {
  get: (path, config) => api.get(path, config),
  patch: (path, body) => api.patch(path, body),
};
