import axios from "axios";
import { getToken } from "../hooks/auth"; // Import function to get stored token

const BASE_PRL = import.meta.env.VITE_BASE_URL;
const BASE_LRL = import.meta.env.VITE_BASE_LRL;

const BASE_URL = BASE_LRL || BASE_PRL;
// Create an Axios instance
const api = axios.create({
  baseURL: BASE_URL, // Backend URL
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
