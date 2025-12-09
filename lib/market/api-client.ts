/**
 * Market API Client
 * Client-side API for fetching worker marketplace data
 * Migrated to use Axios for consistent error handling
 */

import { axiosClient } from "@/lib/http/axios-client";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { WorkerFilters, WorkersResponse } from "./types";
import { ApiResponse } from "@/lib/http/response";

/**
 * Build query params object from filters
 */
function buildQueryParams(filters: WorkerFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.age_min !== undefined) {
    params.age_min = filters.age_min.toString();
  }
  if (filters.age_max !== undefined) {
    params.age_max = filters.age_max.toString();
  }
  if (filters.service_id) {
    params.service_id = filters.service_id;
  }
  if (filters.category_id) {
    params.category_id = filters.category_id;
  }
  if (filters.price_min !== undefined) {
    params.price_min = filters.price_min.toString();
  }
  if (filters.price_max !== undefined) {
    params.price_max = filters.price_max.toString();
  }
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.page !== undefined) {
    params.page = filters.page.toString();
  }
  if (filters.limit !== undefined) {
    params.limit = filters.limit.toString();
  }

  return params;
}

/**
 * Market API Client
 * Uses Axios for consistent error handling
 */
export const marketAPI = {
  /**
   * Fetch workers with filters
   * Returns paginated list of workers
   */
  async getWorkers(filters: WorkerFilters = {}): Promise<WorkersResponse> {
    try {
      const params = buildQueryParams(filters);

      const { data } = await axiosClient.get<ApiResponse<WorkersResponse>>(
        "/market/workers",
        { params }
      );

      if (!data.success || !data.data) {
        throw new Error(
          data.error ||
            data.message ||
            getErrorMessage(ERROR_MESSAGES.FETCH_WORKERS_FAILED)
        );
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.FETCH_WORKERS_FAILED));
    }
  },
};
