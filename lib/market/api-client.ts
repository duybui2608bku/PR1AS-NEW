/**
 * Market API Client
 * Client-side API for fetching worker marketplace data
 */

import { WorkerFilters, WorkersResponse } from "./types";
import { ApiResponse } from "@/lib/http/response";

/**
 * Build query string from filters
 */
function buildQueryString(filters: WorkerFilters): string {
  const params = new URLSearchParams();

  if (filters.age_min !== undefined) {
    params.append("age_min", filters.age_min.toString());
  }
  if (filters.age_max !== undefined) {
    params.append("age_max", filters.age_max.toString());
  }
  if (filters.service_id) {
    params.append("service_id", filters.service_id);
  }
  if (filters.category_id) {
    params.append("category_id", filters.category_id);
  }
  if (filters.price_min !== undefined) {
    params.append("price_min", filters.price_min.toString());
  }
  if (filters.price_max !== undefined) {
    params.append("price_max", filters.price_max.toString());
  }
  if (filters.search) {
    params.append("search", filters.search);
  }
  if (filters.page !== undefined) {
    params.append("page", filters.page.toString());
  }
  if (filters.limit !== undefined) {
    params.append("limit", filters.limit.toString());
  }

  return params.toString();
}

export const marketAPI = {
  /**
   * Fetch workers with filters
   *
   * NOTE: After refactor, API responses are wrapped in ApiResponse<T>.
   * This client un-wraps the `data` field so callers still receive
   * a plain `WorkersResponse` object.
   */
  async getWorkers(filters: WorkerFilters = {}): Promise<WorkersResponse> {
    const queryString = buildQueryString(filters);
    const url = `/api/market/workers${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    const json: ApiResponse<WorkersResponse> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(
        json.error || json.message || "Failed to fetch workers"
      );
    }

    if (!json.data) {
      throw new Error("No data returned from workers API");
    }

    return json.data;
  },
};
