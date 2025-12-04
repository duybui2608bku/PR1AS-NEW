"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
  );
}

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!cachedClient) {
    cachedClient = createBrowserClient(supabaseUrl!, supabaseAnonKey!);
  }
  return cachedClient;
}

// Alias for convenience
export function createClient() {
  return getSupabaseClient();
}
