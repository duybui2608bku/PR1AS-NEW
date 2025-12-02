import { NextResponse } from "next/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const POST = withErrorHandling(async () => {
  // Create response
  const response = successResponse(null, "Logged out successfully");

  // Clear authentication cookies
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  
  return response;
});

