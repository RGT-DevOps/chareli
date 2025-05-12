import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle errors (e.g., authentication errors)
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      // Redirect to login page if needed
    }
    return Promise.reject(error);
  }
);

/**
 * Backend service for API calls
 */
export const backendService = {
  /**
   * GET request
   * @param url - API endpoint
   * @param config - Axios request config
   * @returns Promise with response data
   */
  get: (url: string, config?: AxiosRequestConfig) => api.get(url, config),

  /**
   * POST request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Axios request config
   * @returns Promise with response data
   */
  post: (url: string, data?: any, config?: AxiosRequestConfig) => api.post(url, data, config),

  /**
   * PUT request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Axios request config
   * @returns Promise with response data
   */
  put: (url: string, data?: any, config?: AxiosRequestConfig) => api.put(url, data, config),

  /**
   * PATCH request
   * @param url - API endpoint
   * @param data - Request payload
   * @param config - Axios request config
   * @returns Promise with response data
   */
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => api.patch(url, data, config),

  /**
   * DELETE request
   * @param url - API endpoint
   * @param config - Axios request config
   * @returns Promise with response data
   */
  delete: (url: string, config?: AxiosRequestConfig) => api.delete(url, config),
};
