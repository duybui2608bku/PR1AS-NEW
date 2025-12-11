/**
 * Admin Utilities
 * Shared utility functions for admin pages
 */

import type { EscrowStatus } from "@/lib/wallet/types";
import type { TransactionStatus } from "@/lib/wallet/types";

/**
 * Get color for escrow status
 */
export function getEscrowStatusColor(status: EscrowStatus): string {
  const colors: Record<EscrowStatus, string> = {
    held: "blue",
    released: "green",
    refunded: "purple",
    disputed: "volcano",
    cancelled: "default",
  };
  return colors[status] || "default";
}

/**
 * Get color for transaction status
 */
export function getTransactionStatusColor(status: TransactionStatus): string {
  const colors: Record<TransactionStatus, string> = {
    pending: "orange",
    processing: "blue",
    completed: "green",
    failed: "red",
    cancelled: "default",
  };
  return colors[status] || "default";
}

