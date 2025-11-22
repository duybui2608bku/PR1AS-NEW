/**
 * Page Loading Component
 * Loading component for page transitions and initial page loads
 * Usage: <PageLoading />
 */

"use client";

import Loading from "./Loading";

export default function PageLoading() {
  return <Loading variant="fullPage" size="large" tip="Đang tải trang..." />;
}
