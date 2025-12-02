/**
 * Admin Escrows API
 * GET /api/admin/escrows - Get all escrow holds with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WalletService } from "@/lib/wallet/service";
import { EscrowFilters, EscrowStatus } from "@/lib/wallet/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
        },
        { status: 403 }
      );
    }

    // Parse filters
    const { searchParams } = new URL(request.url);
    const filters: EscrowFilters = {
      status: searchParams.get("status")
        ? (searchParams.get("status")!.split(",") as EscrowStatus[])
        : undefined,
      has_complaint:
        searchParams.get("has_complaint") === "true"
          ? true
          : searchParams.get("has_complaint") === "false"
          ? false
          : undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1,
      limit: searchParams.get("limit")
        ? Number(searchParams.get("limit"))
        : 20,
    };

    const walletService = new WalletService(supabase);
    const { escrows, total } = await walletService.getEscrows(filters);

    return NextResponse.json({
      success: true,
      escrows,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / (filters.limit || 20)),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}


