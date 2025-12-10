"use client";

import { BookingList, FavoriteWorkersList } from "@/components/booking";
import { Typography, Tabs } from "antd";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function ClientBookingsPage() {
  const { t } = useTranslation();

  const tabItems = [
    {
      key: "bookings",
      label: t("booking.myBookings") || "Đặt chỗ của tôi",
      children: <BookingList userRole="client" />,
    },
    {
      key: "favorites",
      label: t("booking.favoriteWorkers") || "Worker yêu thích",
      children: <FavoriteWorkersList />,
    },
  ];

  return (
    <div className="dark:text-white [&_.ant-tabs-tab]:dark:text-gray-300 [&_.ant-tabs-tab-active]:dark:text-white [&_.ant-typography]:dark:text-white">
      <Title level={2} className="dark:text-white">
        {t("booking.title") || "Quản lý đặt chỗ"}
      </Title>
      <Tabs 
        items={tabItems} 
        defaultActiveKey="bookings"
      />
    </div>
  );
}
