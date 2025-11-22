/**
 * Auth Helper for Wallet APIs
 * Provides common authentication logic for wallet API routes
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface AuthResult {
  user: {
    id: string;
    email?: string;
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

