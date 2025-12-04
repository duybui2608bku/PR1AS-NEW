/**
 * Simple HTTP client wrapper around fetch
 * - Centralizes JSON parsing & error handling
 * - Optional credentials/header merging
 */

export interface HttpRequestOptions<TBody = unknown> {
  method?: string;
  headers?: HeadersInit;
  /**
   * Request body. Will be JSON.stringified if not undefined.
   */
  body?: TBody;
  /**
   * Whether to send cookies with the request.
   * Defaults to "include" for authenticated requests.
   */
  credentials?: RequestCredentials;
}

export interface HttpErrorShape {
  success?: boolean;
  error?: string;
  message?: string;
  code?: string;
  data?: unknown;
  [key: string]: unknown;
}

/**
 * Perform a JSON HTTP request and return parsed response.
 * Throws Error when response is not ok.
 */
export async function httpRequestJson<TResponse = unknown, TBody = unknown>(
  url: string,
  options: HttpRequestOptions<TBody> = {}
): Promise<TResponse> {
  const { method = "GET", headers, body, credentials } = options;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    credentials,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // ignore JSON parse errors for empty responses
  }

  const errorShape: HttpErrorShape | null =
    data && typeof data === "object" ? data : null;

  const isApiStyleResponse =
    errorShape && typeof errorShape.success === "boolean";

  if (!response.ok || (isApiStyleResponse && errorShape && errorShape.success === false)) {
    const message =
      errorShape?.error ||
      errorShape?.message ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  // If this looks like our standardized ApiResponse<T>, unwrap the data field
  if (isApiStyleResponse) {
    const apiResponse = errorShape as {
      success: boolean;
      data?: TResponse;
    };

    if ("data" in apiResponse) {
      return apiResponse.data as TResponse;
    }

    // Fallback: return full Api-style object if no data field is present
    return apiResponse as unknown as TResponse;
  }

  // Non-ApiResponse payloads are returned as-is
  return data as TResponse;
}
