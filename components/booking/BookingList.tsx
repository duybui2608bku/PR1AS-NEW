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
  Alert,
  DatePicker,
} from "antd";
import { ReloadOutlined, CalendarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/lib/booking/types";
import BookingCard from "./BookingCard";
import { useBookings } from "@/hooks/booking/useBooking";
import { useEffect } from "react";
import { showMessage } from "@/lib/utils/toast";
import dayjs, { type Dayjs } from "dayjs";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/vi";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import "dayjs/locale/ko";
import viVN from "antd/locale/vi_VN";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";
import koKR from "antd/locale/ko_KR";
import { ConfigProvider } from "antd";

dayjs.extend(localeData);

const { Title } = Typography;

interface BookingListProps {
  userRole: "client" | "worker";
  initialStatus?: BookingStatus[];
}

export default function BookingList({
  userRole,
  initialStatus,
}: BookingListProps) {
  const { t, i18n } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<BookingStatus[]>(
    initialStatus || []
  );
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);

  // Get Ant Design locale based on current language
  const getAntdLocale = () => {
    const currentLang = i18n.language || "vi";
    switch (currentLang) {
      case "en":
        return enUS;
      case "zh":
        return zhCN;
      case "ko":
        return koKR;
      default:
        return viVN;
    }
  };

  // Get date format based on locale
  const getDateFormat = () => {
    const currentLang = i18n.language || "vi";
    switch (currentLang) {
      case "en":
        return "MM/DD/YYYY"; // US format
      case "zh":
        return "YYYY-MM-DD"; // Chinese format
      case "ko":
        return "YYYY-MM-DD"; // Korean format
      default:
        return "DD/MM/YYYY"; // Vietnamese format
    }
  };

  // Get dayjs locale based on current language
  useEffect(() => {
    const currentLang = i18n.language || "vi";
    switch (currentLang) {
      case "en":
        dayjs.locale("en");
        break;
      case "zh":
        dayjs.locale("zh-cn");
        break;
      case "ko":
        dayjs.locale("ko");
        break;
      default:
        dayjs.locale("vi");
    }
  }, [i18n.language]);

  // Handle date changes with validation
  const handleDateFromChange = (date: Dayjs | null) => {
    setDateFrom(date);
    // If date_from is after date_to, clear date_to
    if (date && dateTo && date.isAfter(dateTo)) {
      setDateTo(null);
      showMessage.warning(t("booking.dateFromAfterDateTo"));
    }
  };

  const handleDateToChange = (date: Dayjs | null) => {
    setDateTo(date);
    // If date_to is before date_from, clear date_from
    if (date && dateFrom && date.isBefore(dateFrom)) {
      setDateFrom(null);
      showMessage.warning(t("booking.dateToBeforeDateFrom"));
    }
  };

  // Use React Query hook
  const {
    data: bookings = [],
    isLoading: loading,
    error,
    refetch,
  } = useBookings({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    date_from: dateFrom ? dateFrom.format("YYYY-MM-DD") : undefined,
    date_to: dateTo ? dateTo.format("YYYY-MM-DD") : undefined,
  });

  // Show error message if API call fails
  useEffect(() => {
    if (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách đặt chỗ. Vui lòng thử lại.";
      showMessage.error(errorMessage);
      console.error("BookingList API Error:", error);
    }
  }, [error]);

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
    <ConfigProvider locale={getAntdLocale()}>
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
            <Space wrap>
              <Select
                mode="multiple"
                placeholder={t("booking.filterByStatus")}
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
              <DatePicker
                placeholder={t("booking.filterDateFrom")}
                value={dateFrom}
                onChange={handleDateFromChange}
                format={getDateFormat()}
                allowClear
                style={{ width: 150 }}
                disabledDate={(current) =>
                  dateTo ? current && current.isAfter(dateTo) : false
                }
              />
              <DatePicker
                placeholder={t("booking.filterDateTo")}
                value={dateTo}
                onChange={handleDateToChange}
                format={getDateFormat()}
                allowClear
                style={{ width: 150 }}
                disabledDate={(current) =>
                  dateFrom ? current && current.isBefore(dateFrom) : false
                }
              />
              <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                {t("common.refresh")}
              </Button>
            </Space>
          }
      >
        {error ? (
          <Alert
            message={t("common.error")}
            description={
              error instanceof Error
                ? error.message
                : t("booking.loadError") || t("common.error")
            }
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => refetch()}>
                {t("common.retry") || t("common.refresh")}
              </Button>
            }
            style={{ margin: 16 }}
          />
        ) : loading ? (
          <Spin
            style={{ display: "block", textAlign: "center", padding: 40 }}
          />
        ) : bookings.length === 0 ? (
          <Empty
            description={t("booking.noBookings")}
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
    </ConfigProvider>
  );
}
