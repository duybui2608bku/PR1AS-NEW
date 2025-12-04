/**
 * Client (customer) API Client
 * - Profile settings
 */

import { httpRequestJson } from "@/lib/http/client";

export interface ClientProfileSettings {
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  country?: string | null;
  language?: string | null;
  address?: string | null;
}

export const clientAPI = {
  /**
   * Get current client's profile settings
   */
  async getProfile(): Promise<ClientProfileSettings> {
    const result = await httpRequestJson<{
      profile?: ClientProfileSettings;
    }>(
      "/api/client/profile",
      {
        method: "GET",
        credentials: "include",
      }
    );

    return result.profile ?? {};
  },

  /**
   * Update current client's profile settings
   */
  async updateProfile(
    profile: ClientProfileSettings
  ): Promise<ClientProfileSettings> {
    await httpRequestJson<unknown>("/api/client/profile", {
      method: "PUT",
      credentials: "include",
      body: profile,
    });

    return profile;
  },
};


