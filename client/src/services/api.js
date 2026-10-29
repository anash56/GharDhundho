import axios from "axios";

// Production uses the Vercel same-origin /api rewrite. This allows the browser
// to send the HTTP-only auth cookie without cross-site cookie restrictions.
const baseURL = import.meta.env.PROD
  ? "/api"
  : import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
