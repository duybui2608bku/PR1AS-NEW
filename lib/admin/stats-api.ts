/**
 * Admin Stats API Client
 */

import { httpRequestJson } from "@/lib/http/client";
import { getAuthHeaders } from "@/lib/auth/client-helpers";

export interface AdminDashboardStats {
  totalUsers: number;
  activeWorkers: number;
  totalJobs: number;
  revenue: number;
}

export const adminStatsAPI = {
  async getStats(dateFrom?: string, dateTo?: string): Promise<AdminDashboardStats> {
    const params = new URLSearchParams();
    if (dateFrom) {
      params.append("date_from", dateFrom);
    }
    if (dateTo) {
      params.append("date_to", dateTo);
    }

    const headers = await getAuthHeaders();

    const result = await httpRequestJson<AdminDashboardStats>(
      `/api/admin/stats?${params.toString()}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );

    return result || {
      totalUsers: 0,
      activeWorkers: 0,
      totalJobs: 0,
      revenue: 0,
    };
  },
};

