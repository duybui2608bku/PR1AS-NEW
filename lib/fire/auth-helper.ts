/**
 * Auth Helper for Fire APIs
 * Provides common authentication logic for Fire API routes
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface AuthResult {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
  supabase: ReturnType<typeof createClient>;
  error?: string;
}

/**
 * Get authenticated user from request
 * Checks both Authorization header and httpOnly cookies
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthResult> {
  // Get token from Authorization header OR cookies
  let token = request.headers.get('authorization')?.replace('Bearer ', '');

  // If no Authorization header, try to get from httpOnly cookies
  if (!token) {
    token = request.cookies.get('sb-access-token')?.value;
  }

  if (!token) {
    return {
      user: { id: '' },
      supabase: createClient(supabaseUrl, supabaseServiceKey),
      error: 'Unauthorized',
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify token and get user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      user: { id: '' },
      supabase,
      error: 'Invalid token',
    };
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return {
    user: {
      id: user.id,
      email: user.email,
      role: profile?.role,
    },
    supabase,
  };
}

/**
 * Check if user is a worker
 */
export function isWorker(user: { role?: string }): boolean {
  return user.role === 'worker';
}

/**
 * Check if user is an admin
 */
export function isAdmin(user: { role?: string }): boolean {
  return user.role === 'admin';
}
