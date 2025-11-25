/**
 * Auth Helper for Wallet APIs
 * Provides common authentication logic for wallet API routes
 */

import { NextRequest } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  };
  supabase: SupabaseClient<any>;
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
      supabase: createAdminClient(),
      error: 'Unauthorized',
    };
  }

  const supabase = createAdminClient();

  // Verify token and get user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      user: { id: '' },
      supabase,
      error: 'Invalid token',
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    supabase,
  };
}

