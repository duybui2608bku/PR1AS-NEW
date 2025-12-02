import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

// GET /api/admin/users - Get all users
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Get users from auth.users
  const { data: authUsers, error: authError } =
    await supabase.auth.admin.listUsers();

  if (authError) {
    throw authError;
  }

  // Get user profiles for additional info
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*");

  // Merge auth users with profile data
  const users = authUsers.users.map((user) => {
    const profile = profiles?.find((p) => p.id === user.id);
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      banned_until: (user as any).banned_until, // Supabase auth user type doesn't include this
      user_metadata: {
        ...user.user_metadata,
        role: user.user_metadata?.role || profile?.role || "client",
        full_name: user.user_metadata?.full_name || profile?.full_name,
      },
      profile: profile || null,
    };
  });

  return successResponse({ users, total: users.length });
});
