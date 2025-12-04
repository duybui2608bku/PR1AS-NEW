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
 * - Always throw a normalized Error when status is not ok
 */
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorShape>) => {
    if (error.response) {
      const data = error.response.data;
      const message =
        data?.error ||
        data?.message ||
        `Request failed with status ${error.response.status}`;

      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error("Network error or no response received"));
    }

    return Promise.reject(error);
  }
);
