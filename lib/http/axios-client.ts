/**
 * Axios HTTP client with interceptors
 * - Base URL: /api
 * - Sends cookies by default
 * - Normalizes error handling
 *
 * NOTE: This client is intended for browser/client-side usage.
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

export interface ApiErrorShape {
  error?: string;
  message?: string;
  code?: string | number;
  [key: string]: unknown;
}

export interface AuthenticatedRequestConfig {
  /**
   * Optional access token that will be transformed into Authorization header
   * by the request interceptor.
   */
  accessToken?: string;
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true, // send cookies for authentication
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor
 * - You can attach Authorization token, locale, etc. here
 */
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Example: attach Authorization header if caller provided accessToken in custom config
    // (Usage: axiosClient.get("/wallet/balance", { headers: {}, accessToken }))
    const anyConfig = config as InternalAxiosRequestConfig & {
      accessToken?: string;
    };

    if (anyConfig.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${anyConfig.accessToken}`;
      // Do not keep accessToken on config sent to server
      delete (anyConfig as any).accessToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * - Unwrap data from successful responses
 * - Normalize errors for failed requests
 */
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // For successful responses, return the data directly
    // This allows: const data = await axiosClient.get('/endpoint')
    // Instead of: const { data } = await axiosClient.get('/endpoint')
    return response;
  },
  (error: AxiosError<ApiErrorShape>) => {
    // Handle response errors (4xx, 5xx)
    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;

      // Extract error message from various possible fields
      const message =
        data?.error ||
        data?.message ||
        `Request failed with status ${status}`;

      // Create a custom error with additional context
      const customError = new Error(message) as Error & {
        statusCode?: number;
        code?: string | number;
        data?: ApiErrorShape;
      };

      customError.statusCode = status;
      customError.code = data?.code;
      customError.data = data;

      return Promise.reject(customError);
    }

    // Handle network errors (no response received)
    if (error.request) {
      const networkError = new Error(
        "Network error. Please check your internet connection."
      ) as Error & { isNetworkError: boolean };
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    // Handle other errors (request setup, etc.)
    return Promise.reject(error);
  }
);
