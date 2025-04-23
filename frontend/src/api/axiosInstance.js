// src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000', // Use env var or default
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error("API call error:", error.response || error.message || error);
    // Potentially add more specific error handling or user feedback here
    return Promise.reject(error);
  }
);

export default axiosInstance;