/**
 * Admin Wallet API Client
 * - Transactions overview
 * - Escrow overview
 *
 * These endpoints require an admin access token in the Authorization header.
 */

import {
  Transaction,
  TransactionType,
  TransactionStatus,
  EscrowHold,
  EscrowStatus,
} from "@/lib/wallet/types";
import { httpRequestJson } from "@/lib/http/client";
import { getAuthHeaders } from "@/lib/auth/client-helpers";

interface AdminTransactionsFilters {
  type?: TransactionType[];
  status?: TransactionStatus[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface AdminEscrowsFilters {
  status?: EscrowStatus[];
  has_complaint?: boolean;
  page?: number;
  limit?: number;
}

const adminWalletAPI = {
  /**
   * Get all transactions with filters for admin dashboard
   */
  async getTransactions(filters: AdminTransactionsFilters = {}): Promise<{
    transactions: Transaction[];
    stats: {
      total_transactions: number;
      total_amount: number;
      total_deposits: number;
      total_withdrawals: number;
      total_payments: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters.type && filters.type.length > 0) {
      params.append("type", filters.type.join(","));
    }
    if (filters.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }
    if (filters.date_from) {
      params.append("date_from", filters.date_from);
    }
    if (filters.date_to) {
      params.append("date_to", filters.date_to);
    }
    if (filters.search) {
      params.append("search", filters.search);
    }

    const headers = await getAuthHeaders();

    const result = await httpRequestJson<{
      transactions: Transaction[];
      stats: {
        total_transactions: number;
        total_amount: number;
        total_deposits: number;
        total_withdrawals: number;
        total_payments: number;
      };
    }>(
      `/api/admin/transactions?${params.toString()}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );

    return {
      transactions: result.transactions || [],
      stats: result.stats,
    };
  },

  /**
   * Get escrow holds with filters for admin dashboard
   */
  async getEscrows(filters: AdminEscrowsFilters = {}): Promise<{
    escrows: EscrowHold[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    stats?: {
      total_held: number;
      total_released: number;
      total_disputed: number;
      total_count: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters.status && filters.status.length > 0) {
      params.append("status", filters.status.join(","));
    }
    if (filters.has_complaint !== undefined) {
      params.append("has_complaint", String(filters.has_complaint));
    }
    if (filters.page) {
      params.append("page", String(filters.page));
    }
    if (filters.limit) {
      params.append("limit", String(filters.limit));
    }

    const headers = await getAuthHeaders();

    const result = await httpRequestJson<{
      escrows: EscrowHold[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
      stats?: {
        total_held: number;
        total_released: number;
        total_disputed: number;
        total_count: number;
      };
    }>(
      `/api/admin/escrows?${params.toString()}`,
      {
        method: "GET",
        headers,
        credentials: "include",
      }
    );

    return {
      escrows: result.escrows || [],
      pagination: result.pagination,
      stats: result.stats,
    };
  },

  /**
   * Release an escrow (admin only)
   */
  async releaseEscrow(escrowId: string): Promise<void> {
    const headers = await getAuthHeaders();
    await httpRequestJson<{ transaction: unknown }>(
      "/api/admin/wallet/escrow/release",
      {
        method: "POST",
        headers,
        credentials: "include",
        body: { escrow_id: escrowId },
      }
    );
  },

  /**
   * Resolve a disputed escrow (admin only)
   */
  async resolveEscrow(
    escrowId: string,
    action: "release_to_worker" | "refund_to_employer" | "partial_refund",
    resolutionNotes: string,
    workerAmount?: number,
    employerRefund?: number
  ): Promise<void> {
    const headers = await getAuthHeaders();
    await httpRequestJson<{ escrow: unknown }>(
      "/api/admin/wallet/escrow/resolve",
      {
        method: "POST",
        headers,
        credentials: "include",
        body: {
          escrow_id: escrowId,
          action,
          resolution_notes: resolutionNotes,
          worker_amount: workerAmount,
          employer_refund: employerRefund,
        },
      }
    );
  },
};

export { adminWalletAPI };
export default adminWalletAPI;
