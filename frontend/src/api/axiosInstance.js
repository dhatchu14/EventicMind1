// src/api/axiosInstance.js
import axios from 'axios';
// Optional: Import toast if you want to use it for global error handling
// import { toast } from 'sonner';

// Use environment variable or default for the API base URL
// Make sure this points to your FastAPI backend, including any /api prefix if needed
// Example: 'http://localhost:8000' or 'http://localhost:8000/api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    // You can add other default headers here if needed
  }
});

// --- REQUEST Interceptor ---
// This interceptor runs BEFORE each request is sent using `axiosInstance`.
// Its purpose is to automatically add the JWT Authorization header.
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Retrieve the authentication token from localStorage.
    // *** CRITICAL: Ensure the key 'accessToken' EXACTLY MATCHES ***
    // *** the key you used with localStorage.setItem() in your Login component ***
    const token = localStorage.getItem('accessToken');

    // 2. If a token is found, add it to the request's Authorization header.
    if (token) {
      // The format MUST be 'Bearer <token>' with a space after Bearer.
      config.headers['Authorization'] = `Bearer ${token}`;
      // console.log('[Request Interceptor] Attaching token:', token ? 'Token Found' : 'No Token Found'); // Uncomment for debugging
    } else {
      // console.log('[Request Interceptor] No token found for Authorization header.'); // Uncomment for debugging
      // Optional: Remove header if no token exists, preventing potential issues with stale headers
      // delete config.headers['Authorization'];
    }

    // 3. IMPORTANT: Always return the modified config object for the request to proceed.
    return config;
  },
  (error) => {
    // Handle errors that might occur during the request setup phase (rare).
    console.error("[Axios Request Interceptor] Error:", error);
    // Reject the promise to propagate the error.
    return Promise.reject(error);
  }
);

// --- RESPONSE Interceptor ---
// This interceptor runs AFTER a response is received from the backend.
// It allows for global handling of responses and errors.
axiosInstance.interceptors.response.use(
  (response) => {
    // If the response status code is within the 2xx range (success),
    // just return the response directly.
    return response;
  },
  (error) => {
    // If the response status code is outside the 2xx range (error),
    // this part of the interceptor is triggered.
    console.error("API Call Error:", error.response || error.message || error);

    // --- Optional: Global 401 Unauthorized Handling ---
    // This is a good place to automatically handle expired/invalid tokens.
    if (error.response?.status === 401) {
       console.error("Authorization Error (401): Token may be invalid or expired.");

       // Uncomment and adapt the following lines for automatic logout:
       // 1. Remove the potentially invalid token from storage.
       // localStorage.removeItem('accessToken');

       // 2. Show a message to the user.
       // toast.error("Your session has expired. Please log in again.");

       // 3. Redirect the user to the login page.
       // window.location.href = '/login'; // Full page reload redirect
       // Or use react-router's navigate function if available globally

       // Optionally: Dispatch a global event if other parts of your app need to react
       // window.dispatchEvent(new Event('userLoggedOut'));
    }
    // --- End Optional 401 Handling ---

    // IMPORTANT: Reject the promise with the error object. This allows
    // individual .catch() blocks in your components (like in ProductDetails)
    // to still receive and handle the error specifically if needed.
    return Promise.reject(error);
  }
);

// Export the configured axios instance for use throughout your application.
export default axiosInstance;