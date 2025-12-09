/**
 * Booking List Component
 * Displays a list of bookings with filters
 * Usage: <BookingList userRole="client" />
 */

"use client";

import { useState } from "react";
import {
  Card,
  List,
  Empty,
  Spin,
  Select,
  Space,
  Button,
  Typography,
  Tabs,
} from "antd";
import { ReloadOutlined, CalendarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/lib/booking/types";
import BookingCard from "./BookingCard";
import { useBookings } from "@/hooks/booking/useBooking";

const { Title } = Typography;

interface BookingListProps {
  userRole: "client" | "worker";
  initialStatus?: BookingStatus[];
}

export default function BookingList({
  userRole,
  initialStatus,
}: BookingListProps) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>(
    initialStatus || []
  );

  // Use React Query hook
  const {
    data: bookings = [],
    isLoading: loading,
    refetch,
  } = useBookings({
    status: statusFilter.length > 0 ? statusFilter : undefined,
  });

  const handleUpdate = () => {
    refetch();
  };

  const statusOptions: { label: string; value: BookingStatus }[] = [
    {
      label: t("booking.status.pending_worker_confirmation"),
      value: "pending_worker_confirmation",
    },
    {
      label: t("booking.status.worker_confirmed"),
      value: "worker_confirmed",
    },
    {
      label: t("booking.status.worker_declined"),
      value: "worker_declined",
    },
    {
      label: t("booking.status.in_progress"),
      value: "in_progress",
    },
    {
      label: t("booking.status.worker_completed"),
      value: "worker_completed",
    },
    {
      label: t("booking.status.client_completed"),
      value: "client_completed",
    },
    {
      label: t("booking.status.cancelled"),
      value: "cancelled",
    },
  ];

  const activeBookings = bookings.filter(
    (b) =>
      b.status === "pending_worker_confirmation" ||
      b.status === "worker_confirmed" ||
      b.status === "in_progress" ||
      b.status === "worker_completed"
  );

  const completedBookings = bookings.filter(
    (b) => b.status === "client_completed"
  );

  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  return (
    <div>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <Title level={4} style={{ margin: 0 }}>
              {t("booking.title")}
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Select
              mode="multiple"
              placeholder={t("booking.filterByStatus") || "Lọc theo trạng thái"}
              style={{ width: 250 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
            >
              {statusOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              {t("common.refresh")}
            </Button>
          </Space>
        }
      >
        {loading ? (
          <Spin
            style={{ display: "block", textAlign: "center", padding: 40 }}
          />
        ) : bookings.length === 0 ? (
          <Empty
            description={t("booking.noBookings") || "Không có đặt chỗ nào"}
          />
        ) : (
          <Tabs
            defaultActiveKey="all"
            items={[
              {
                key: "all",
                label: `${t("booking.all") || "Tất cả"} (${bookings.length})`,
                children: (
                  <List
                    dataSource={bookings}
                    renderItem={(booking) => (
                      <List.Item>
                        <BookingCard
                          booking={booking}
                          userRole={userRole}
                          onUpdate={handleUpdate}
                        />
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: "active",
                label: `${t("booking.active") || "Đang hoạt động"} (${
                  activeBookings.length
                })`,
                children: (
                  <List
                    dataSource={activeBookings}
                    renderItem={(booking) => (
                      <List.Item>
                        <BookingCard
                          booking={booking}
                          userRole={userRole}
                          onUpdate={handleUpdate}
                        />
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: "completed",
                label: `${t("booking.completed") || "Đã hoàn thành"} (${
                  completedBookings.length
                })`,
                children: (
                  <List
                    dataSource={completedBookings}
                    renderItem={(booking) => (
                      <List.Item>
                        <BookingCard
                          booking={booking}
                          userRole={userRole}
                          onUpdate={handleUpdate}
                        />
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: "cancelled",
                label: `${t("booking.cancelled") || "Đã hủy"} (${
                  cancelledBookings.length
                })`,
                children: (
                  <List
                    dataSource={cancelledBookings}
                    renderItem={(booking) => (
                      <List.Item>
                        <BookingCard
                          booking={booking}
                          userRole={userRole}
                          onUpdate={handleUpdate}
                        />
                      </List.Item>
                    )}
                  />
                ),
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
