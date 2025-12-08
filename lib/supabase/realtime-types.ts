/**
 * Supabase Realtime Type Definitions
 * Types for Realtime postgres_changes payloads
 */

export interface RealtimePostgresInsertPayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T | null;
  errors: string[] | null;
}

export interface RealtimePostgresUpdatePayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "UPDATE";
  new: T;
  old: T;
  errors: string[] | null;
}

export interface RealtimePostgresDeletePayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: "DELETE";
  new: null;
  old: T;
  errors: string[] | null;
}

export type RealtimePostgresChangesPayload<T = Record<string, unknown>> =
  | RealtimePostgresInsertPayload<T>
  | RealtimePostgresUpdatePayload<T>
  | RealtimePostgresDeletePayload<T>;

export type RealtimeChannelStatus =
  | "SUBSCRIBED"
  | "TIMED_OUT"
  | "CLOSED"
  | "CHANNEL_ERROR";
