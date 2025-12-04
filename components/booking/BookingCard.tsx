/**
 * Booking Card Component
 * Displays a booking with actions based on user role and booking status
 * Usage: <BookingCard booking={booking} onUpdate={handleUpdate} />
 */

"use client";

import { useState } from "react";
import {
  Card,
  Tag,
  Space,
  Button,
  Typography,
  Descriptions,
  message,
  Popconfirm,
  Avatar,
  Modal,
  Input,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { bookingAPI } from "@/lib/booking/api-client";
import type { Booking, BookingStatus } from "@/lib/booking/types";
import dayjs from "dayjs";
import { walletAPI } from "@/lib/wallet/api-client";

const { Text, Title } = Typography;

interface BookingCardProps {
  booking: Booking;
  userRole: "client" | "worker" | "admin";
  onUpdate?: () => void;
}

export default function BookingCard({
  booking,
  userRole,
  onUpdate,
}: BookingCardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);
  const [complaintModalVisible, setComplaintModalVisible] = useState(false);
  const [complaintText, setComplaintText] = useState("");

  // Extract service name from booking metadata (set in backend via service.name_key)
  const serviceNameKey = (booking.metadata as any)?.service_name_key as
    | string
    | undefined;
  const translatedServiceName = serviceNameKey
    ? t(`services.${serviceNameKey}`)
    : undefined;

  // Extract client info (email, name, avatar) from metadata when available
  const clientEmail = (booking.metadata as any)?.client_email as
    | string
    | undefined;
  const clientName = (booking.metadata as any)?.client_name as
    | string
    | undefined;
  const clientAvatarUrl = (booking.metadata as any)?.client_avatar_url as
    | string
    | undefined;

  const getStatusColor = (status: BookingStatus) => {
    const colors: Record<BookingStatus, string> = {
      pending_worker_confirmation: "orange",
      worker_confirmed: "blue",
      worker_declined: "red",
      in_progress: "cyan",
      worker_completed: "purple",
      client_completed: "green",
      cancelled: "default",
      disputed: "volcano",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status: BookingStatus) => {
    return t(`booking.status.${status}`) || status;
  };

  const handleConfirm = async () => {
    try {
      setLoading("confirm");
      await bookingAPI.confirmBooking(booking.id);
      message.success(t("booking.confirmSuccess"));
      onUpdate?.();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading("decline");
      await bookingAPI.declineBooking(booking.id);
      message.success(t("booking.declineSuccess"));
      onUpdate?.();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const handleWorkerComplete = async () => {
    try {
      setLoading("complete");
      await bookingAPI.workerCompleteBooking(booking.id);
      message.success(
        t("booking.workerCompleteSuccess") || "Đã đánh dấu hoàn thành"
      );
      onUpdate?.();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const handleClientComplete = async () => {
    try {
      setLoading("complete");
      await bookingAPI.clientCompleteBooking(booking.id);
      message.success(t("booking.completeSuccess"));
      onUpdate?.();
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    } finally {
      setLoading(null);
    }
  };

  const canWorkerConfirm = () => {
    return (
      userRole === "worker" && booking.status === "pending_worker_confirmation"
    );
  };

  const canWorkerDecline = () => {
    return (
      userRole === "worker" && booking.status === "pending_worker_confirmation"
    );
  };

  const canWorkerComplete = () => {
    return (
      userRole === "worker" &&
      (booking.status === "worker_confirmed" ||
        booking.status === "in_progress")
    );
  };

  const canClientComplete = () => {
    return userRole === "client" && booking.status === "worker_completed";
  };

  /**
   * Determine whether booking is overdue based on expected end time.
   * - If end_date exists, use that.
   * - Otherwise, use start_date + duration_hours.
   */
  const getExpectedEndTime = () => {
    const start = dayjs(booking.start_date);
    return booking.end_date
      ? dayjs(booking.end_date)
      : start.add(booking.duration_hours, "hour");
  };

  const isOverdue = () => {
    const now = dayjs();
    const expectedEnd = getExpectedEndTime();
    return now.isAfter(expectedEnd);
  };

  /**
   * Complaint is only allowed within 72 hours from:
   * - The time the job became overdue, or
   * - The time worker marked as completed (worker_completed_at),
   * whichever is later/relevant.
   */
  const isWithinComplaintWindow = () => {
    const now = dayjs();
    const expectedEnd = getExpectedEndTime();
    const workerCompletedAt = booking.worker_completed_at
      ? dayjs(booking.worker_completed_at)
      : null;

    // If worker has completed, count 72h from worker completion time
    const baseTime =
      (booking.status === "worker_completed" ||
        booking.status === "client_completed") &&
      workerCompletedAt
        ? workerCompletedAt
        : expectedEnd;

    // If job is not yet overdue and worker hasn't completed, cannot complain
    if (!now.isAfter(expectedEnd) && !workerCompletedAt) {
      return false;
    }

    const hoursDiff = now.diff(baseTime, "hour");
    return hoursDiff <= 72;
  };

  const canClientComplain = () => {
    return (
      userRole === "client" &&
      !!booking.escrow_id &&
      isOverdue() &&
      isWithinComplaintWindow() &&
      booking.status !== "client_completed" &&
      booking.status !== "cancelled" &&
      booking.status !== "disputed"
    );
  };

  const handleOpenComplaintModal = () => {
    setComplaintText("");
    setComplaintModalVisible(true);
  };

  const handleSubmitComplaint = async () => {
    if (!booking.escrow_id) return;
    try {
      setLoading("complaint");
      await walletAPI.fileComplaint(
        booking.escrow_id,
        complaintText ||
          t("booking.defaultComplaintReason") ||
          "Dịch vụ bị trễ, worker chưa hoàn thành công việc"
      );
      message.success(
        t("booking.complaintSuccess") ||
          "Đã gửi khiếu nại. Thanh toán sẽ được giữ lại để admin xem xét."
      );
      setComplaintModalVisible(false);
      onUpdate?.();
    } catch (error: any) {
      message.error(
        error?.message ||
          t("booking.complaintError") ||
          "Không thể gửi khiếu nại. Vui lòng thử lại."
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card
      style={{ marginBottom: 8, padding: 16 }}
      actions={
        userRole !== "admin"
          ? [
              canWorkerConfirm() && (
                <Button
                  key="confirm"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleConfirm}
                  loading={loading === "confirm"}
                  block
                >
                  {t("booking.confirm")}
                </Button>
              ),
              canWorkerDecline() && (
                <Popconfirm
                  key="decline"
                  title={
                    t("booking.declineConfirm") ||
                    "Bạn có chắc muốn từ chối đặt chỗ này?"
                  }
                  onConfirm={handleDecline}
                  okText={t("common.yes")}
                  cancelText={t("common.no")}
                >
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={loading === "decline"}
                    block
                  >
                    {t("booking.decline")}
                  </Button>
                </Popconfirm>
              ),
              canWorkerComplete() && (
                <Button
                  key="complete"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleWorkerComplete}
                  loading={loading === "complete"}
                  block
                >
                  {t("booking.complete")}
                </Button>
              ),
              canClientComplete() && (
                <Button
                  key="client-complete"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleClientComplete}
                  loading={loading === "complete"}
                  block
                >
                  {t("booking.confirmCompletion") || "Xác nhận hoàn thành"}
                </Button>
              ),
              canClientComplain() && (
                <Button
                  key="complaint"
                  danger
                  icon={<ExclamationCircleOutlined />}
                  onClick={handleOpenComplaintModal}
                  loading={loading === "complaint"}
                  block
                >
                  {t("booking.complain") || "Khiếu nại"}
                </Button>
              ),
            ].filter(Boolean)
          : undefined
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {translatedServiceName || t("booking.title")}
            </Title>
          </div>
          <Tag color={getStatusColor(booking.status)}>
            {getStatusLabel(booking.status)}
          </Tag>
        </div>

        <Descriptions column={1} size="small">
          <Descriptions.Item
            label={
              <Space>
                <UserOutlined /> {t("booking.client") || "Khách hàng"}
              </Space>
            }
          >
            <Space>
              {clientAvatarUrl && (
                <Avatar
                  size="small"
                  src={clientAvatarUrl}
                  icon={<UserOutlined />}
                />
              )}
              <span>
                {clientName ||
                  clientEmail ||
                  `${booking.client_id.slice(0, 8)}...`}
              </span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <CalendarOutlined />{" "}
                {t("booking.bookingType") || "Loại đặt chỗ"}
              </Space>
            }
          >
            {t(`booking.types.${booking.booking_type}`)}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <ClockCircleOutlined /> {t("booking.duration") || "Thời lượng"}
              </Space>
            }
          >
            {booking.duration_hours} {t("common.hours") || "giờ"}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <Space>
                <CalendarOutlined /> {t("booking.startDate") || "Ngày bắt đầu"}
              </Space>
            }
          >
            {dayjs(booking.start_date).format("YYYY-MM-DD HH:mm")}
          </Descriptions.Item>
          {booking.end_date && (
            <Descriptions.Item
              label={
                <Space>
                  <CalendarOutlined /> {t("booking.endDate") || "Ngày kết thúc"}
                </Space>
              }
            >
              {dayjs(booking.end_date).format("YYYY-MM-DD HH:mm")}
            </Descriptions.Item>
          )}
          {booking.location && (
            <Descriptions.Item label={t("booking.location") || "Địa điểm"}>
              {booking.location}
            </Descriptions.Item>
          )}
          <Descriptions.Item
            label={
              <Space>
                <DollarOutlined /> {t("booking.totalAmount") || "Tổng tiền"}
              </Space>
            }
          >
            <Text strong style={{ fontSize: 16, color: "#3f8600" }}>
              ${booking.final_amount_usd.toFixed(2)}
            </Text>
            {booking.discount_percent > 0 && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                -{booking.discount_percent}%
              </Tag>
            )}
          </Descriptions.Item>
          {booking.special_instructions && (
            <Descriptions.Item
              label={t("booking.specialInstructions") || "Yêu cầu đặc biệt"}
            >
              {booking.special_instructions}
            </Descriptions.Item>
          )}
        </Descriptions>

        {booking.created_at && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t("booking.createdAt") || "Tạo lúc"}:{" "}
            {dayjs(booking.created_at).format("YYYY-MM-DD HH:mm")}
          </Text>
        )}
      </Space>
      <Modal
        title={t("booking.complaintTitle") || "Khiếu nại đơn đặt chỗ"}
        open={complaintModalVisible}
        onOk={handleSubmitComplaint}
        onCancel={() => setComplaintModalVisible(false)}
        okButtonProps={{ loading: loading === "complaint" }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Paragraph>
            {t("booking.complaintDescription") ||
              "Vui lòng mô tả lý do khiếu nại (ví dụ: worker trễ giờ, không hoàn thành công việc, chất lượng kém...)."}
          </Typography.Paragraph>
          <Input.TextArea
            rows={4}
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder={
              t("booking.complaintPlaceholder") ||
              "Nhập nội dung khiếu nại của bạn..."
            }
          />
        </Space>
      </Modal>
    </Card>
  );
}

