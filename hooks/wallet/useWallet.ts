/**
 * React Query hooks for Wallet operations
 * Wallet API already uses Axios, these hooks add React Query caching
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletAPI } from "@/lib/wallet/api-client";
import { showMessage } from "@/lib/utils/toast";
import type {
  DepositRequest,
  WithdrawalRequest,
  PaymentRequest,
  TransactionFilters,
  EscrowFilters,
} from "@/lib/wallet/types";

/**
 * Query keys for wallet operations
 */
export const walletKeys = {
  all: ["wallet"] as const,
  balance: () => [...walletKeys.all, "balance"] as const,
  transactions: () => [...walletKeys.all, "transactions"] as const,
  transactionsList: (filters?: TransactionFilters) =>
    [...walletKeys.transactions(), { filters }] as const,
  escrows: () => [...walletKeys.all, "escrows"] as const,
  escrowsList: (filters?: EscrowFilters) =>
    [...walletKeys.escrows(), { filters }] as const,
  settings: () => [...walletKeys.all, "settings"] as const,
};

/**
 * Get wallet balance and summary
 */
export function useWalletBalance() {
  return useQuery({
    queryKey: walletKeys.balance(),
    queryFn: () => walletAPI.getBalance(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get transactions list with filters
 */
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: walletKeys.transactionsList(filters),
    queryFn: () => walletAPI.getTransactions(filters || {}),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get escrow holds with filters
 */
export function useEscrows(filters?: EscrowFilters) {
  return useQuery({
    queryKey: walletKeys.escrowsList(filters),
    queryFn: () => walletAPI.getEscrows(filters || {}),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get platform settings
 */
export function usePlatformSettings() {
  return useQuery({
    queryKey: walletKeys.settings(),
    queryFn: () => walletAPI.getPlatformSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes - settings change rarely
  });
}

/**
 * Request deposit
 */
export function useRequestDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: DepositRequest) => walletAPI.requestDeposit(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
      showMessage.success("Deposit request submitted successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to request deposit");
    },
  });
}

/**
 * Request withdrawal
 */
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: WithdrawalRequest) =>
      walletAPI.requestWithdrawal(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
      showMessage.success("Withdrawal request submitted successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to request withdrawal");
    },
  });
}

/**
 * Make payment
 */
export function useMakePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PaymentRequest) => walletAPI.makePayment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      queryClient.invalidateQueries({ queryKey: walletKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: walletKeys.escrows() });
      showMessage.success("Payment completed successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Payment failed");
    },
  });
}

/**
 * File complaint for escrow
 */
export function useFileComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      escrowId,
      description,
    }: {
      escrowId: string;
      description: string;
    }) => walletAPI.fileComplaint(escrowId, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: walletKeys.escrows() });
      queryClient.invalidateQueries({ queryKey: walletKeys.balance() });
      showMessage.success("Complaint filed successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to file complaint");
    },
  });
}
