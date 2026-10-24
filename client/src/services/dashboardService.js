import api from "./api.js";

export const dashboardService = {
  get: (path) => api.get(path),
};
