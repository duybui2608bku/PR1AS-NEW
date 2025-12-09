import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Middleware for route protection and role-based access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get("sb-access-token")?.value;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/banned"];
  const publicRoutePatterns = [
    /^\/workers\/.*/, // Worker public profiles
    /^\/market/, // Market/listing pages
  ];
  const isPublicRoute =
    publicRoutes.some((route) => pathname === route) ||
    publicRoutePatterns.some((pattern) => pattern.test(pathname));

  // Auth routes (login, signup) - redirect if already authenticated
  const authRoutes = ["/auth/login", "/auth/signup"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Protected route patterns
  const protectedRoutes = {
    admin: /^\/admin/,
    client: /^\/client/,
    worker: /^\/worker/,
  };

  // Check if route is protected
  const isProtectedRoute = Object.values(protectedRoutes).some((pattern) =>
    pattern.test(pathname)
  );

  // If accessing auth pages while authenticated, redirect to dashboard
  if (isAuthRoute && token) {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.status === "banned") {
            return NextResponse.redirect(new URL("/banned", request.url));
          }

          // Redirect to appropriate dashboard
          const dashboardUrl = getDashboardUrl(profile.role);
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
      }
    } catch {
      // Silently fail - allow request to continue
    }
  }

  // If route is public, allow access
  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // If route is protected, check authentication and role
  if (isProtectedRoute) {
    if (!token) {
      // Not authenticated, redirect to login
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        // Invalid token, redirect to login
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        // No profile, redirect to login
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check if banned
      if (profile.status === "banned") {
        return NextResponse.redirect(new URL("/banned", request.url));
      }

      // Check role-based access
      const userRole = profile.role;

      // Admin access
      if (protectedRoutes.admin.test(pathname)) {
        if (userRole !== "admin") {
          // Not admin, redirect to their dashboard
          const dashboardUrl = getDashboardUrl(userRole);
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
      }

      // Client access
      if (protectedRoutes.client.test(pathname)) {
        if (userRole !== "client") {
          // Not client, redirect to their dashboard
          const dashboardUrl = getDashboardUrl(userRole);
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
      }

      // Worker access
      if (protectedRoutes.worker.test(pathname)) {
        if (userRole !== "worker") {
          // Not worker, redirect to their dashboard
          const dashboardUrl = getDashboardUrl(userRole);
          return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
      }

      // Access granted
      return NextResponse.next();
    } catch {
      // On error, redirect to login
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

/**
 * Get dashboard URL based on role
 */
function getDashboardUrl(role: string): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "client":
      return "/client/dashboard";
    case "worker":
      return "/worker/dashboard";
    default:
      return "/";
  }
}

/**
 * Configure which routes should be processed by middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
