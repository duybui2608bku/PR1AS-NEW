/**
 * Favorites API Client
 * Client-side API for managing worker favorites
 */

import { axiosClient } from "@/lib/http/axios-client";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { ApiResponse } from "@/lib/http/response";

export interface Favorite {
  id: string;
  worker_profile_id: string;
  created_at: string;
  worker_profile?: any;
}

export interface FavoritesResponse {
  favorites: Favorite[];
  count: number;
}

export interface CheckFavoritesResponse {
  favorited_worker_ids: string[];
}

/**
 * Favorites API Client
 */
export const favoritesAPI = {
  /**
   * Get user's favorite workers
   */
  async getFavorites(): Promise<FavoritesResponse> {
    try {
      const { data } = await axiosClient.get<ApiResponse<FavoritesResponse>>(
        "/favorites"
      );

      if (!data.success || !data.data) {
        throw new Error(
          data.error ||
            data.message ||
            getErrorMessage(ERROR_MESSAGES.FETCH_FAILED)
        );
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.FETCH_FAILED));
    }
  },

  /**
   * Check if specific workers are favorited
   */
  async checkFavorites(workerIds: string[]): Promise<string[]> {
    try {
      const { data } = await axiosClient.get<ApiResponse<CheckFavoritesResponse>>(
        "/favorites",
        {
          params: {
            worker_ids: workerIds.join(","),
          },
        }
      );

      if (!data.success || !data.data) {
        throw new Error(
          data.error ||
            data.message ||
            getErrorMessage(ERROR_MESSAGES.FETCH_FAILED)
        );
      }

      return data.data.favorited_worker_ids || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.FETCH_FAILED));
    }
  },

  /**
   * Add a worker to favorites
   */
  async addFavorite(workerProfileId: string): Promise<void> {
    try {
      const { data } = await axiosClient.post<ApiResponse<any>>("/favorites", {
        worker_profile_id: workerProfileId,
      });

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            getErrorMessage(ERROR_MESSAGES.OPERATION_FAILED)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.OPERATION_FAILED));
    }
  },

  /**
   * Remove a worker from favorites
   */
  async removeFavorite(workerProfileId: string): Promise<void> {
    try {
      const { data } = await axiosClient.delete<ApiResponse<any>>("/favorites", {
        params: {
          worker_profile_id: workerProfileId,
        },
      });

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            getErrorMessage(ERROR_MESSAGES.OPERATION_FAILED)
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.OPERATION_FAILED));
    }
  },
};

