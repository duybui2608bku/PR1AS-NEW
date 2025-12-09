/**
 * HTTP Client Helpers
 * Reusable utilities for handling API responses in client components
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Handle fetch response and parse JSON
 * Throws error if response is not ok or success is false
 *
 * @param response - Fetch response object
 * @param errorMessage - Default error message if none provided in response
 * @returns Parsed JSON data
 */
export async function handleApiResponse<T>(
  response: Response,
  errorMessage: string = "Request failed"
): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  // Guard against non-JSON responses
  if (!contentType.includes("application/json")) {
    throw new Error("Server returned an invalid response");
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json?.success) {
    throw new Error(json?.error || json?.message || errorMessage);
  }

  return json.data as T;
}

/**
 * Handle fetch response and extract data from a specific key
 *
 * @param response - Fetch response object
 * @param dataKey - Key to extract from response data
 * @param errorMessage - Default error message
 * @returns Data from the specified key
 */
export async function handleApiResponseWithKey<T>(
  response: Response,
  dataKey: string,
  errorMessage: string = "Request failed"
): Promise<T> {
  const data = await handleApiResponse<Record<string, any>>(
    response,
    errorMessage
  );
  return data[dataKey] as T;
}

/**
 * Make a GET request with error handling
 *
 * @param url - Request URL
 * @param headers - Request headers
 * @param errorMessage - Default error message
 * @returns Response data
 */
export async function fetchGet<T>(
  url: string,
  headers?: HeadersInit,
  errorMessage?: string
): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  return handleApiResponse<T>(response, errorMessage);
}

/**
 * Make a POST request with error handling
 *
 * @param url - Request URL
 * @param body - Request body
 * @param headers - Request headers
 * @param errorMessage - Default error message
 * @returns Response data
 */
export async function fetchPost<T, B = any>(
  url: string,
  body: B,
  headers?: HeadersInit,
  errorMessage?: string
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  return handleApiResponse<T>(response, errorMessage);
}

/**
 * Make a PUT request with error handling
 *
 * @param url - Request URL
 * @param body - Request body
 * @param headers - Request headers
 * @param errorMessage - Default error message
 * @returns Response data
 */
export async function fetchPut<T, B = any>(
  url: string,
  body: B,
  headers?: HeadersInit,
  errorMessage?: string
): Promise<T> {
  const response = await fetch(url, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(body),
  });

  return handleApiResponse<T>(response, errorMessage);
}

/**
 * Make a DELETE request with error handling
 *
 * @param url - Request URL
 * @param headers - Request headers
 * @param errorMessage - Default error message
 * @returns Response data
 */
export async function fetchDelete<T>(
  url: string,
  headers?: HeadersInit,
  errorMessage?: string
): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers,
    credentials: "include",
  });

  return handleApiResponse<T>(response, errorMessage);
}

/**
 * Build query string from params object
 *
 * @param params - Query parameters
 * @returns Query string
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(","));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
