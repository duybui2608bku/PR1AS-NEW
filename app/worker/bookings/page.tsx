"use client";

import { BookingList } from "@/components/booking";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function WorkerBookingsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <Title level={2}>{t("booking.title") || "Quản lý đặt chỗ"}</Title>
      <BookingList userRole="worker" />
    </div>
  );
}
