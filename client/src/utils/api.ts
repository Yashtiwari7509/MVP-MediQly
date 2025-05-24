import axios from "axios";
import { getToken } from "../hooks/use-auth"; // Import function to get stored token

const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";
// Create an Axios instance
const api = axios.create({
  baseURL: BASE_URL, // Backend URL with /api prefix
});

// Attach token dynamically to every request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Attach token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
