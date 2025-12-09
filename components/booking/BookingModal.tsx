/**
 * Booking Modal Component
 * Allows clients to create a booking request for a worker's service
 * Usage: <BookingModal open={open} onClose={onClose} workerId={id} workerServiceId={id} />
 */

"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Input,
  Button,
  Alert,
  Space,
  Typography,
  Descriptions,
  Spin,
  Tooltip,
  Row,
  Col,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import type {
  BookingCalculation,
  CreateBookingRequest,
} from "@/lib/booking/types";
import dayjs from "dayjs";
import {
  useCalculatePrice,
  useCreateBooking,
} from "@/hooks/booking/useBooking";

const { Text } = Typography;
const { TextArea } = Input;

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  workerId: string;
  /**
   * Default worker service to select when modal opens.
   * This is typically the "main" service shown on the profile.
   */
  workerServiceId: string;
  workerName?: string;
  serviceName?: string;
  /**
   * Optional list of services that this worker provides.
   * When provided and length > 1, the modal will render a dropdown
   * allowing the client to pick which service to book.
   */
  availableServices?: {
    id: string;
    name: string;
  }[];
}

export default function BookingModal({
  open,
  onClose,
  onSuccess,
  workerId,
  workerServiceId,
  workerName,
  serviceName,
  availableServices,
}: BookingModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [bookingType, setBookingType] = useState<
    "hourly" | "daily" | "weekly" | "monthly"
  >("hourly");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [selectedWorkerServiceId, setSelectedWorkerServiceId] =
    useState<string>(workerServiceId);
  const [selectedServiceName, setSelectedServiceName] = useState<
    string | undefined
  >(serviceName);

  // React Query mutations
  const createBooking = useCreateBooking();
  const calculatePrice = useCalculatePrice();

  /**
   * Tự động cập nhật ngày kết thúc dựa trên:
   * - bookingType (hourly / daily / weekly / monthly)
   * - durationHours (số giờ / ngày / tuần / tháng)
   * - start_date (ngày bắt đầu)
   *
   * Mục tiêu: Khi user đổi "Số ngày" (hoặc số tuần / tháng) thì field end_date
   * sẽ tự nhảy lại, không giữ nguyên giá trị cũ.
   */
  const autoUpdateEndDate = () => {
    const startDate = form.getFieldValue("start_date") as dayjs.Dayjs | null;

    // Trường hợp đặt theo giờ: end_date luôn bằng start_date và bị disable trên UI.
    if (bookingType === "hourly") {
      if (startDate) {
        form.setFieldsValue({ end_date: startDate });
      }
      return;
    }

    const duration = form.getFieldValue("duration_hours") as number | null;

    if (!startDate || !duration || duration <= 0) return;

    let unit: dayjs.ManipulateType = "hour";

    if (bookingType === "daily") {
      unit = "day";
    } else if (bookingType === "weekly") {
      unit = "week";
    } else if (bookingType === "monthly") {
      unit = "month";
    } else {
      unit = "hour";
    }

    const newEndDate = startDate.add(duration, unit);
    const currentEndDate = form.getFieldValue("end_date") as dayjs.Dayjs | null;

    // Chỉ set lại nếu khác để tránh vòng lặp onValuesChange
    if (!currentEndDate || !currentEndDate.isSame(newEndDate)) {
      form.setFieldsValue({ end_date: newEndDate });
    }
  };

  /**
   * Chiều ngược lại: Khi người dùng chỉnh end_date (hoặc start_date + end_date),
   * thì tự động suy ra lại "số ngày / tuần / tháng" (duration_hours trong form).
   */
  const autoUpdateDurationFromDates = () => {
    const startDate = form.getFieldValue("start_date") as dayjs.Dayjs | null;
    const endDate = form.getFieldValue("end_date") as dayjs.Dayjs | null;

    if (!startDate || !endDate) return;
    if (!endDate.isAfter(startDate)) return;

    let unit: dayjs.ManipulateType = "hour";

    if (bookingType === "daily") {
      unit = "day";
    } else if (bookingType === "weekly") {
      unit = "week";
    } else if (bookingType === "monthly") {
      unit = "month";
    } else {
      unit = "hour";
    }

    // Lấy số đơn vị chênh lệch (ngày / tuần / tháng / giờ)
    let diff = endDate.diff(startDate, unit);

    // Đảm bảo tối thiểu là 1
    if (diff < 1) {
      diff = 1;
    }

    const currentDuration =
      (form.getFieldValue("duration_hours") as number | null) ?? 1;

    if (currentDuration !== diff) {
      setDurationHours(diff);
      form.setFieldsValue({ duration_hours: diff });
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      calculatePrice.reset();
      setBookingType("hourly");
      setDurationHours(1);
      setSelectedWorkerServiceId(workerServiceId);
      setSelectedServiceName(serviceName);
    }
  }, [open, form, workerServiceId, serviceName]);

  useEffect(() => {
    const triggerCalculation = () => {
      if (!selectedWorkerServiceId) {
        calculatePrice.reset();
        return;
      }
      if (!durationHours || durationHours <= 0) {
        calculatePrice.reset();
        return;
      }

      // Chuyển đổi đơn vị (giờ / ngày / tuần / tháng) sang số giờ thực tế
      // theo pricing guide: daily = 8h, weekly = 56h, monthly = 160h.
      let effectiveDurationHours = durationHours;
      if (bookingType === "daily") {
        effectiveDurationHours = durationHours * 8;
      } else if (bookingType === "weekly") {
        effectiveDurationHours = durationHours * 56;
      } else if (bookingType === "monthly") {
        effectiveDurationHours = durationHours * 160;
      }

      calculatePrice.mutate({
        workerServiceId: selectedWorkerServiceId,
        bookingType: bookingType,
        durationHours: effectiveDurationHours,
      });
    };

    if (open && durationHours > 0) {
      triggerCalculation();
    }
  }, [open, bookingType, durationHours, selectedWorkerServiceId]);

  const handleSubmit = async (values: any) => {
    // Chuyển đổi đơn vị duration sang giờ thực tế giống như lúc calculate price
    let effectiveDurationHours = durationHours;
    if (bookingType === "daily") {
      effectiveDurationHours = durationHours * 8;
    } else if (bookingType === "weekly") {
      effectiveDurationHours = durationHours * 56;
    } else if (bookingType === "monthly") {
      effectiveDurationHours = durationHours * 160;
    }

    // Đặt theo giờ: không gửi end_date, tránh lỗi validate "End date must be after start date"
    // Các loại khác: nếu user chọn end_date thì gửi ISO string.
    const endDateISO =
      bookingType === "hourly" || !values.end_date
        ? undefined
        : values.end_date.toISOString();

    const bookingRequest: CreateBookingRequest = {
      worker_id: workerId,
      worker_service_id: selectedWorkerServiceId,
      booking_type: bookingType,
      duration_hours: effectiveDurationHours,
      start_date: values.start_date.toISOString(),
      end_date: endDateISO,
      location: values.location,
      special_instructions: values.special_instructions,
    };

    createBooking.mutate(bookingRequest, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  const handleClose = () => {
    form.resetFields();
    calculatePrice.reset();
    onClose();
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedWorkerServiceId(serviceId);

    if (availableServices && availableServices.length > 0) {
      const matched = availableServices.find((svc) => svc.id === serviceId);
      setSelectedServiceName(matched?.name ?? serviceName);
    }
  };

  const getDurationLabel = () => {
    const labels: Record<string, string> = {
      hourly: t("booking.types.hourly"),
      daily: t("booking.types.daily"),
      weekly: t("booking.types.weekly"),
      monthly: t("booking.types.monthly"),
    };
    return labels[bookingType] || bookingType;
  };

  return (
    <Modal
      title={t("booking.title")}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={800}
      bodyStyle={{
        padding: 24,
        background: "#fafafa",
      }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ booking_type: "hourly", duration_hours: 1 }}
        onValuesChange={(changedValues) => {
          const changedKeys = Object.keys(changedValues);
          const changedStart = changedKeys.includes("start_date");
          const changedDuration = changedKeys.includes("duration_hours");
          const changedEnd = changedKeys.includes("end_date");

          // Đặt chỗ theo giờ: end_date luôn bằng start_date và bị disable.
          if (bookingType === "hourly") {
            if (changedStart) {
              autoUpdateEndDate();
            }
            // Không làm gì thêm vì user không sửa trực tiếp end_date được.
            return;
          }

          // Các loại daily / weekly / monthly:
          // 1) Thay đổi start_date hoặc duration_hours (nhưng không trực tiếp sửa end_date)
          //    => tự tính lại end_date dựa trên số ngày / tuần / tháng
          if ((changedStart || changedDuration) && !changedEnd) {
            autoUpdateEndDate();
          }

          // 2) Thay đổi end_date (user kéo / chọn lại ngày kết thúc)
          //    => tự tính lại số ngày / tuần / tháng
          if (changedEnd && !changedDuration) {
            autoUpdateDurationFromDates();
          }
        }}
      >
        {/* Service Info */}
        {(selectedServiceName || serviceName) && (
          <Alert
            message={selectedServiceName || serviceName}
            description={
              workerName
                ? `${t("worker.profile.worker")}: ${workerName}`
                : undefined
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Row 0: Service Selector (if worker has multiple services) */}
        {availableServices && availableServices.length > 1 && (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label={t("booking.service") || "Dịch vụ"}
                name="worker_service_id"
                initialValue={selectedWorkerServiceId}
                rules={[
                  {
                    required: true,
                    message:
                      t("booking.serviceRequired") ||
                      "Vui lòng chọn dịch vụ bạn muốn đặt",
                  },
                ]}
              >
                <Select
                  value={selectedWorkerServiceId}
                  onChange={(value) => {
                    handleServiceChange(value);
                  }}
                >
                  {availableServices.map((svc) => (
                    <Select.Option key={svc.id} value={svc.id}>
                      {svc.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        )}

        {/* Row 1: Booking Type + Duration */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t("booking.types.title") || "Loại đặt chỗ"}
              name="booking_type"
              rules={[{ required: true }]}
            >
              <Select
                value={bookingType}
                onChange={(value) => {
                  setBookingType(value);
                  form.setFieldsValue({ booking_type: value });
                }}
              >
                <Select.Option value="hourly">
                  {t("booking.types.hourly")}
                </Select.Option>
                <Select.Option value="daily">
                  {t("booking.types.daily")}
                </Select.Option>
                <Select.Option value="weekly">
                  {t("booking.types.weekly")}
                </Select.Option>
                <Select.Option value="monthly">
                  {t("booking.types.monthly")}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={
                bookingType === "hourly"
                  ? t("booking.durationHours") || "Số giờ"
                  : bookingType === "daily"
                  ? t("booking.durationDays") || "Số ngày"
                  : bookingType === "weekly"
                  ? t("booking.durationWeeks") || "Số tuần"
                  : t("booking.durationMonths") || "Số tháng"
              }
              name="duration_hours"
              rules={[
                {
                  required: true,
                  message:
                    t("booking.durationRequired") || "Vui lòng nhập thời lượng",
                },
                {
                  type: "number",
                  min: 1,
                  message: t("booking.durationMin") || "Tối thiểu 1",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                value={durationHours}
                onChange={(value) => {
                  setDurationHours(value || 1);
                  form.setFieldsValue({ duration_hours: value || 1 });
                }}
                placeholder={
                  t("booking.durationPlaceholder") || "Nhập thời lượng"
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Start Date + End Date */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={t("booking.startDate") || "Ngày bắt đầu"}
              name="start_date"
              rules={[
                {
                  required: true,
                  message:
                    t("booking.startDateRequired") ||
                    "Vui lòng chọn ngày bắt đầu",
                },
              ]}
            >
              <DatePicker
                style={{ width: "100%" }}
                showTime
                format="YYYY-MM-DD HH:mm"
                disabledDate={(current) =>
                  current && current < dayjs().startOf("day")
                }
                placeholder={
                  t("booking.startDatePlaceholder") ||
                  "Chọn ngày và giờ bắt đầu"
                }
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={t("booking.endDate") || "Ngày kết thúc (tùy chọn)"}
              name="end_date"
            >
              <DatePicker
                style={{ width: "100%" }}
                showTime
                format="YYYY-MM-DD HH:mm"
                disabledDate={(current) => {
                  const startDate = form.getFieldValue("start_date");
                  return current && startDate && current < startDate;
                }}
                disabled={bookingType === "hourly"}
                placeholder={
                  t("booking.endDatePlaceholder") || "Chọn ngày và giờ kết thúc"
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 3: Location */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              label={t("booking.location") || "Địa điểm"}
              name="location"
            >
              <Input
                placeholder={
                  t("booking.locationPlaceholder") || "Nhập địa điểm (nếu có)"
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 4: Special Instructions */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              label={t("booking.specialInstructions") || "Yêu cầu đặc biệt"}
              name="special_instructions"
            >
              <TextArea
                rows={2}
                placeholder={
                  t("booking.specialInstructionsPlaceholder") ||
                  "Nhập yêu cầu đặc biệt (nếu có)"
                }
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 5: Price Calculation (full width at bottom) */}
        {calculatePrice.isPending || calculatePrice.isError || calculatePrice.data ? (
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {calculatePrice.isPending ? (
                <Spin
                  style={{ display: "block", textAlign: "center", padding: 20 }}
                />
              ) : calculatePrice.isError ? (
                <Alert
                  message={t("booking.calculationError") || "Lỗi tính giá"}
                  description={calculatePrice.error?.message || "Không thể tính giá"}
                  type="error"
                  showIcon
                />
              ) : calculatePrice.data ? (
                <Alert
                  message={
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item
                          label={t("booking.types.title") || "Loại"}
                        >
                          {getDurationLabel()}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t("booking.duration") || "Thời lượng"}
                        >
                          {durationHours}{" "}
                          {bookingType === "hourly"
                            ? t("common.hours") || "giờ"
                            : bookingType === "daily"
                            ? t("common.days") || "ngày"
                            : bookingType === "weekly"
                            ? t("common.weeks") || "tuần"
                            : t("common.months") || "tháng"}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label={t("booking.hourlyRate") || "Giá theo giờ"}
                        >
                          <Text strong>
                            ${calculatePrice.data.hourly_rate_usd.toFixed(2)}
                          </Text>
                        </Descriptions.Item>
                        {calculatePrice.data.discount_percent > 0 && (
                          <Descriptions.Item
                            label={t("booking.discount") || "Giảm giá"}
                          >
                            <Text type="success">
                              -{calculatePrice.data.discount_percent}%
                            </Text>
                          </Descriptions.Item>
                        )}
                        <Descriptions.Item
                          label={t("booking.totalAmount") || "Tổng tiền"}
                        >
                          <Text
                            strong
                            style={{ fontSize: 18, color: "#3f8600" }}
                          >
                            ${calculatePrice.data.final_amount_usd.toFixed(2)}
                          </Text>
                        </Descriptions.Item>
                      </Descriptions>
                      {!calculatePrice.data.can_afford ? (
                        <Alert
                          message={t("booking.insufficientBalance")}
                          description={
                            <Space direction="vertical" size="small">
                              <Text>
                                {t("booking.requiredAmount")}:{" "}
                                <Text strong>
                                  ${calculatePrice.data.required_amount.toFixed(2)}
                                </Text>
                              </Text>
                              <Text>
                                {t("booking.availableBalance")}:{" "}
                                <Text strong>
                                  ${calculatePrice.data.client_balance.toFixed(2)}
                                </Text>
                              </Text>
                            </Space>
                          }
                          type="error"
                          showIcon
                          style={{ marginTop: 12 }}
                        />
                      ) : (
                        <Alert
                          message={t("booking.sufficientBalance") || "Số dư đủ"}
                          description={`${t(
                            "booking.availableBalance"
                          )}: $${calculatePrice.data.client_balance.toFixed(2)}`}
                          type="success"
                          showIcon
                          style={{ marginTop: 12 }}
                        />
                      )}
                    </Space>
                  }
                  type={calculatePrice.data.can_afford ? "info" : "warning"}
                  showIcon
                />
              ) : null}
            </Col>
          </Row>
        ) : null}

        {/* Submit Button */}
        <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={handleClose}>{t("common.cancel")}</Button>
            <Tooltip
              title={
                calculatePrice.isPending
                  ? t("booking.calculating") || "Đang tính giá..."
                  : !calculatePrice.data
                  ? t("booking.waitingForCalculation") ||
                    "Vui lòng đợi tính giá..."
                  : !calculatePrice.data.can_afford
                  ? t("booking.insufficientBalance") || "Số dư không đủ"
                  : undefined
              }
            >
              <Button
                type="primary"
                htmlType="submit"
                loading={createBooking.isPending || calculatePrice.isPending}
                disabled={
                  calculatePrice.isPending ||
                  !calculatePrice.data ||
                  !calculatePrice.data.can_afford
                }
                icon={<CalendarOutlined />}
              >
                {t("booking.create")}
              </Button>
            </Tooltip>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
