/**
 * Admin Loading Component
 * Loading state for admin routes
 */

import Loading from "@/components/common/Loading";

export default function AdminLoading() {
  return <Loading variant="fullPage" size="large" tip="Đang tải trang quản trị..." />;
}

