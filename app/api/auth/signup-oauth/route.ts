import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { role, provider = "google", redirectTo } = await request.json();

    // Validate role
    if (!role || !["client", "worker"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'client' or 'worker'" },
        { status: 400 }
      );
    }

    // Validate provider
    if (provider !== "google") {
      return NextResponse.json(
        { error: "Only 'google' provider is supported" },
        { status: 400 }
      );
    }

    // Generate callback URL with role parameter
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const defaultRedirect = `${baseUrl}/auth/callback`;
    const callbackUrl = redirectTo || defaultRedirect;
    
    // Add role as query parameter
    const urlWithRole = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}role=${role}`;

    return NextResponse.json({
      success: true,
      provider,
      role,
      callbackUrl: urlWithRole,
      message: "Use Supabase client to call signInWithOAuth on the frontend",
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

