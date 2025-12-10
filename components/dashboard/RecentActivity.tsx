"use client";

import { useEffect, useState } from "react";
import { Card, List, Avatar, Typography, Empty, Spin, Space, Tag } from "antd";
import {
  CheckCircleOutlined,
  MessageOutlined,
  CalendarOutlined,
  DollarOutlined,
  BellOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Notification } from "@/lib/booking/types";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

interface RecentActivityProps {
  limit?: number;
}

interface EnrichedNotification extends Notification {
  booking?: {
    id: string;
    status: string;
    start_date?: string;
    end_date?: string;
    final_amount_usd?: number;
    service?: { name_key?: string };
    worker?: {
      full_name?: string;
      user_id?: string;
    } | null;
    client?: {
      full_name?: string;
      email?: string;
      avatar_url?: string;
    } | null;
  };
}

export default function RecentActivity({ limit = 4 }: RecentActivityProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [notifications, setNotifications] = useState<EnrichedNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/notifications/list?limit=${limit}&page=1`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setNotifications(result.data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (item: EnrichedNotification) => {
    // If booking has worker/client info, show their avatar
    if (item.booking?.worker?.full_name) {
      return (
        <Avatar
          src={item.booking.client?.avatar_url}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#1890ff" }}
        />
      );
    }
    if (item.booking?.client?.avatar_url) {
      return (
        <Avatar
          src={item.booking.client.avatar_url}
          icon={<UserOutlined />}
          style={{ backgroundColor: "#1890ff" }}
        />
      );
    }

    // Otherwise show icon based on type
    switch (item.type) {
      case "booking_confirmed":
        return (
          <Avatar
            icon={<CheckCircleOutlined />}
            style={{ backgroundColor: "#52c41a" }}
          />
        );
      case "booking_request":
      case "booking_completed":
        return (
          <Avatar
            icon={<CalendarOutlined />}
            style={{ backgroundColor: "#1890ff" }}
          />
        );
      case "payment_received":
      case "payment_released":
      case "escrow_released":
        return (
          <Avatar
            icon={<DollarOutlined />}
            style={{ backgroundColor: "#52c41a" }}
          />
        );
      default:
        return (
          <Avatar
            icon={<MessageOutlined />}
            style={{ backgroundColor: "#fa8c16" }}
          />
        );
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "booking_confirmed":
        return "#52c41a";
      case "payment_received":
      case "payment_released":
      case "escrow_released":
        return "#1890ff";
      default:
        return undefined;
    }
  };

  const formatTimeAgo = (date: string) => {
    return dayjs(date).fromNow();
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {t("client.dashboard.recentActivity") || "Recent Activity"}
        </Title>
        <BellOutlined style={{ fontSize: 18, color: "#8c8c8c" }} />
      </div>

      {notifications.length === 0 ? (
        <Empty
          description={t("client.dashboard.noActivity") || "No recent activity"}
          style={{ padding: "40px 0" }}
        />
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => {
            const bgColor = getNotificationColor(item.type);
            const booking = item.booking;
            const workerName = booking?.worker?.full_name;
            const clientName = booking?.client?.full_name;
            const serviceName = booking?.service?.name_key
              ? t(`services.${booking.service.name_key}`)
              : null;
            const amount = booking?.final_amount_usd;
            const startDate = booking?.start_date
              ? dayjs(booking.start_date)
              : null;

            return (
              <List.Item
                style={{
                  padding: "16px 0",
                  borderBottom: "1px solid #f0f0f0",
                  cursor: booking ? "pointer" : "default",
                }}
                onClick={() => {
                  if (booking) {
                    router.push(`/client/bookings`);
                  }
                }}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item)}
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                      <Text
                        strong
                        style={{
                          color: bgColor ? "#fff" : undefined,
                          backgroundColor: bgColor,
                          padding: bgColor ? "2px 8px" : undefined,
                          borderRadius: bgColor ? 4 : undefined,
                          fontSize: 14,
                          marginRight: 8,
                        }}
                      >
                        {t(`notification.${item.type}.title`) || item.title}
                      </Text>
                        {(workerName || clientName) && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {workerName || clientName}
                          </Text>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTimeAgo(item.created_at)}
                      </Text>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {t(`notification.${item.type}.message`) || item.message}
                      </Text>
                      {booking && (
                        <Space
                          size="small"
                          style={{ marginTop: 8, flexWrap: "wrap" }}
                        >
                          {serviceName && (
                            <Tag color="blue" icon={<CalendarOutlined />}>
                              {serviceName}
                            </Tag>
                          )}
                          {startDate && (
                            <Tag
                              color="default"
                              icon={<ClockCircleOutlined />}
                            >
                              {startDate.format("DD/MM/YYYY HH:mm")}
                            </Tag>
                          )}
                          {amount && (
                            <Tag color="green" icon={<DollarOutlined />}>
                              ${Number(amount).toFixed(2)}
                            </Tag>
                          )}
                          {booking.status && (
                            <Tag
                              color={
                                booking.status === "worker_confirmed"
                                  ? "green"
                                  : booking.status === "pending_worker_confirmation"
                                  ? "orange"
                                  : booking.status === "client_completed"
                                  ? "blue"
                                  : "default"
                              }
                            >
                              {t(`booking.status.${booking.status}`) ||
                                booking.status}
                            </Tag>
                          )}
                        </Space>
                      )}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      {notifications.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <a
            href="/client/notifications"
            style={{ color: "#1890ff", fontSize: 14 }}
          >
            {t("client.dashboard.viewAllActivity") || "View All Activity"}
          </a>
        </div>
      )}
    </Card>
  );
}

