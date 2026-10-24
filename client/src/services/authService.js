import api from "./api.js";

export const authService = {
  register: (body) => api.post("/auth/register", body),
  login: (body) => api.post("/auth/login", body),
  current: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};
