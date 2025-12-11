"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Select,
  Statistic,
  Row,
  Col,
  Avatar,
  Modal,
  Input,
  Form,
  InputNumber,
  Radio,
} from "antd";
import {
  ReloadOutlined,
  AlertOutlined,
  DollarOutlined,
  LockOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { EscrowHold, EscrowStatus } from "@/lib/wallet/types";
import { adminWalletAPI } from "@/lib/admin/wallet-api";
import { showNotification } from "@/lib/utils/toast";
import { getEscrowStatusColor } from "@/lib/admin/utils";

const { Title, Text } = Typography;

interface EscrowFiltersState {
  status?: EscrowStatus[];
  has_complaint?: boolean;
}

export default function AdminEscrowsPage() {
  const { t } = useTranslation();
  const [escrows, setEscrows] = useState<EscrowHold[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EscrowFiltersState>({});
  const [stats, setStats] = useState({
    total_held: 0,
    total_released: 0,
    total_disputed: 0,
    total_count: 0,
  });
  const [releaseModalVisible, setReleaseModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowHold | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolveForm] = Form.useForm();

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const result = await adminWalletAPI.getEscrows(filters);
      setEscrows(result.escrows);
      // Use stats from backend if available, otherwise calculate from current page
      if (result.stats) {
        setStats(result.stats);
      } else {
        const total_count = result.pagination?.total || result.escrows.length;
        const total_held = result.escrows
          .filter((e) => e.status === "held")
          .reduce((sum, e) => sum + Number(e.total_amount_usd || 0), 0);
        const total_released = result.escrows
          .filter((e) => e.status === "released")
          .reduce((sum, e) => sum + Number(e.total_amount_usd || 0), 0);
        const total_disputed = result.escrows
          .filter((e) => e.status === "disputed")
          .reduce((sum, e) => sum + Number(e.total_amount_usd || 0), 0);
        setStats({
          total_held,
          total_released,
          total_disputed,
          total_count,
        });
      }
    } catch (error: any) {
      showNotification.error(
        "Error fetching escrows",
        error.message || "Failed to fetch escrows"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const columns: ColumnsType<EscrowHold> = [
    {
      title: t("escrow.table.id") || "ID",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: t("escrow.table.jobId") || "Booking / Công việc",
      dataIndex: "booking",
      key: "job_id",
      width: 200,
      render: (booking: EscrowHold["booking"], record: EscrowHold) => {
        if (booking) {
          return (
            <Space direction="vertical" size={0}>
              <Text strong>{booking.id.slice(0, 8)}...</Text>
              {booking.booking_type && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t(`booking.types.${booking.booking_type}`) ||
                    booking.booking_type}
                </Text>
              )}
              {booking.service?.name_key && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t(`services.${booking.service.name_key}`) ||
                    booking.service.name_key}
                </Text>
              )}
            </Space>
          );
        }
        return record.job_id ? (
          <Text code>{record.job_id.slice(0, 8)}...</Text>
        ) : (
          "-"
        );
      },
    },
    {
      title: t("escrow.table.employer") || "Client (Người thuê)",
      dataIndex: "employer",
      key: "employer_id",
      width: 200,
      render: (employer: EscrowHold["employer"], record: EscrowHold) => {
        if (employer) {
          return (
            <Space>
              {employer.avatar_url && (
                <Avatar size="small" src={employer.avatar_url} />
              )}
              <Space direction="vertical" size={0}>
                <Text strong>
                  {employer.full_name || employer.email || "N/A"}
                </Text>
                {employer.email && employer.full_name && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {employer.email}
                  </Text>
                )}
              </Space>
            </Space>
          );
        }
        return <Text code>{record.employer_id.slice(0, 8)}...</Text>;
      },
    },
    {
      title: t("escrow.table.worker") || "Worker",
      dataIndex: "worker",
      key: "worker_id",
      width: 250,
      render: (worker: EscrowHold["worker"], record: EscrowHold) => {
        if (worker) {
          return (
            <Space>
              <Avatar
                size="small"
                src={worker.avatar_url}
                icon={!worker.avatar_url ? <UserOutlined /> : undefined}
              />
              <Space direction="vertical" size={0}>
                <Text strong>{worker.full_name || worker.email || "N/A"}</Text>
                {worker.email && worker.full_name && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {worker.email}
                  </Text>
                )}
              </Space>
            </Space>
          );
        }
        return <Text code>{record.worker_id.slice(0, 8)}...</Text>;
      },
    },
    {
      title: t("escrow.table.amount") || "Total Amount",
      dataIndex: "total_amount_usd",
      key: "total_amount_usd",
      width: 140,
      align: "right",
      render: (amount: number) => (
        <Text strong style={{ color: "#3f8600" }}>
          ${Number(amount).toFixed(2)}
        </Text>
      ),
    },
    {
      title: t("escrow.table.workerAmount") || "Worker Receives",
      dataIndex: "worker_amount_usd",
      key: "worker_amount_usd",
      width: 140,
      align: "right",
      render: (amount: number) => <Text>${Number(amount).toFixed(2)}</Text>,
    },
    {
      title: t("escrow.table.status") || "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: EscrowStatus) => (
        <Tag color={getEscrowStatusColor(status)}>
          {t(`escrow.status.${status}`) || status}
        </Tag>
      ),
    },
    {
      title: t("escrow.table.hasComplaint") || "Complaint",
      dataIndex: "has_complaint",
      key: "has_complaint",
      width: 150,
      render: (hasComplaint: boolean) =>
        hasComplaint ? (
          <Tag color="volcano" icon={<AlertOutlined />}>
            {t("escrow.complaint") || "Complaint"}
          </Tag>
        ) : (
          <Tag color="default">{t("common.no") || "No"}</Tag>
        ),
    },
    {
      title: t("escrow.table.holdUntil") || "Hold Until",
      dataIndex: "hold_until",
      key: "hold_until",
      width: 180,
      render: (date: string) =>
        date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: t("escrow.table.createdAt") || "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: t("escrow.table.resolution") || "Resolution Info",
      key: "resolution",
      width: 300,
      render: (_: unknown, record: EscrowHold) => {
        if (!record.resolution_notes && !record.resolved_by) {
          return <Text type="secondary">-</Text>;
        }
        return (
          <Space direction="vertical" size={4} style={{ fontSize: 12 }}>
            {record.resolved_by && (
              <Text type="secondary">
                {t("escrow.resolvedBy") || "Resolved by"}:{" "}
                <Text code>{record.resolved_by.slice(0, 8)}...</Text>
              </Text>
            )}
            {record.released_at && (
              <Text type="secondary">
                {t("escrow.resolvedAt") || "Resolved at"}:{" "}
                {dayjs(record.released_at).format("YYYY-MM-DD HH:mm")}
              </Text>
            )}
            {record.resolution_notes && (
              <Text
                ellipsis={{ tooltip: record.resolution_notes }}
                style={{ maxWidth: 200 }}
              >
                {record.resolution_notes}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: t("common.actions") || "Actions",
      key: "actions",
      width: 200,
      fixed: "right" as const,
      render: (_: unknown, record: EscrowHold) => {
        const canRelease = record.status === "held" && !record.has_complaint;
        const canResolve =
          (record.status === "disputed" || record.has_complaint) &&
          !record.resolution_notes &&
          !record.resolved_by;
        const isResolved = !!record.resolution_notes || !!record.resolved_by;

        return (
          <Space>
            {canRelease && (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedEscrow(record);
                  setReleaseModalVisible(true);
                }}
              >
                {t("escrow.release") || "Release"}
              </Button>
            )}
            {canResolve && (
              <Button
                type="default"
                size="small"
                icon={<AlertOutlined />}
                onClick={() => {
                  setSelectedEscrow(record);
                  setResolveModalVisible(true);
                }}
              >
                {t("escrow.resolve") || "Resolve"}
              </Button>
            )}
            {isResolved && (
              <Button
                type="default"
                size="small"
                icon={<CheckCircleOutlined />}
                disabled
              >
                {t("escrow.resolved") || "Resolved"}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const handleRelease = async () => {
    if (!selectedEscrow) return;

    setActionLoading(true);
    try {
      await adminWalletAPI.releaseEscrow(selectedEscrow.id);
      showNotification.success(
        t("escrow.released") || "Escrow Released",
        t("escrow.releasedSuccess") || "Escrow has been released successfully"
      );
      setReleaseModalVisible(false);
      setSelectedEscrow(null);
      fetchEscrows();
    } catch (error: any) {
      showNotification.error(
        t("escrow.releaseError") || "Release Failed",
        error.message ||
          t("escrow.releaseErrorMsg") ||
          "Failed to release escrow"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedEscrow) return;

    try {
      const values = await resolveForm.validateFields();
      setActionLoading(true);

      await adminWalletAPI.resolveEscrow(
        selectedEscrow.id,
        values.action,
        values.resolution_notes,
        values.worker_amount,
        values.employer_refund
      );

      showNotification.success(
        t("escrow.resolved") || "Escrow Resolved",
        t("escrow.resolvedSuccess") ||
          "Complaint has been resolved successfully"
      );
      setResolveModalVisible(false);
      setSelectedEscrow(null);
      resolveForm.resetFields();
      fetchEscrows();
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      showNotification.error(
        t("escrow.resolveError") || "Resolution Failed",
        error.message ||
          t("escrow.resolveErrorMsg") ||
          "Failed to resolve escrow"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportEscrows = () => {
    if (escrows.length === 0) {
      showNotification.warning(
        t("common.noData") || "No Data",
        t("escrow.noEscrowsToExport") || "No escrows to export"
      );
      return;
    }

    // Create CSV headers
    const headers = [
      "ID",
      "Job ID",
      "Employer ID",
      "Worker ID",
      "Total Amount (USD)",
      "Platform Fee (USD)",
      "Insurance Fee (USD)",
      "Worker Amount (USD)",
      "Status",
      "Has Complaint",
      "Complaint Description",
      "Hold Until",
      "Created At",
      "Released At",
    ];

    // Create CSV rows
    const rows = escrows.map((escrow) => [
      escrow.id,
      escrow.job_id || "",
      escrow.employer_id,
      escrow.worker_id,
      Number(escrow.total_amount_usd).toFixed(2),
      Number(escrow.platform_fee_usd || 0).toFixed(2),
      Number(escrow.insurance_fee_usd || 0).toFixed(2),
      Number(escrow.worker_amount_usd).toFixed(2),
      escrow.status,
      escrow.has_complaint ? "Yes" : "No",
      escrow.complaint_description || "",
      escrow.hold_until
        ? dayjs(escrow.hold_until).format("YYYY-MM-DD HH:mm:ss")
        : "",
      dayjs(escrow.created_at).format("YYYY-MM-DD HH:mm:ss"),
      escrow.released_at
        ? dayjs(escrow.released_at).format("YYYY-MM-DD HH:mm:ss")
        : "",
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const cellStr = String(cell || "");
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      )
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `escrows_export_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification.success(
      t("common.exportSuccess") || "Export Successful",
      t("escrow.exported") || "Escrows exported successfully"
    );
  };

  return (
    <div>
      <Title level={2}>
        {t("admin.escrows.title") || "Escrow Holds (Booking Deposits)"}
      </Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("escrow.stats.totalHeld") || "Total Held"}
              value={stats.total_held}
              prefix={<LockOutlined />}
              precision={2}
              valueStyle={{ color: "#1677ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("escrow.stats.totalReleased") || "Total Released"}
              value={stats.total_released}
              prefix={<UnlockOutlined />}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("escrow.stats.totalDisputed") || "Total Disputed"}
              value={stats.total_disputed}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#fa541c" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("escrow.stats.totalCount") || "Total Escrows"}
              value={stats.total_count}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap style={{ width: "100%" }}>
          <Select
            mode="multiple"
            placeholder={t("escrow.filters.status") || "Escrow Status"}
            style={{ width: 220 }}
            onChange={(value) =>
              setFilters({ ...filters, status: value as EscrowStatus[] })
            }
            allowClear
          >
            <Select.Option value="held">
              {t("escrow.status.held") || "Held"}
            </Select.Option>
            <Select.Option value="released">
              {t("escrow.status.released") || "Released"}
            </Select.Option>
            <Select.Option value="refunded">
              {t("escrow.status.refunded") || "Refunded"}
            </Select.Option>
            <Select.Option value="disputed">
              {t("escrow.status.disputed") || "Disputed"}
            </Select.Option>
            <Select.Option value="cancelled">
              {t("escrow.status.cancelled") || "Cancelled"}
            </Select.Option>
          </Select>
          <Select
            placeholder={t("escrow.filters.complaint") || "Complaint"}
            style={{ width: 180 }}
            onChange={(value) =>
              setFilters({
                ...filters,
                has_complaint:
                  value === "yes" ? true : value === "no" ? false : undefined,
              })
            }
            allowClear
          >
            <Select.Option value="yes">
              {t("escrow.complaintYes") || "Has complaint"}
            </Select.Option>
            <Select.Option value="no">
              {t("escrow.complaintNo") || "No complaint"}
            </Select.Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchEscrows}>
            {t("common.refresh") || "Refresh"}
          </Button>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExportEscrows}
            disabled={loading || escrows.length === 0}
          >
            {t("common.export") || "Export CSV"}
          </Button>
        </Space>
      </Card>

      {/* Escrows Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={escrows}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) =>
              `${t("common.total") || "Total"} ${total} ${
                t("escrow.table.records") || "records"
              }`,
          }}
        />
      </Card>

      {/* Release Confirmation Modal */}
      <Modal
        title={t("escrow.releaseEscrow") || "Release Escrow"}
        open={releaseModalVisible}
        onOk={handleRelease}
        onCancel={() => {
          setReleaseModalVisible(false);
          setSelectedEscrow(null);
        }}
        confirmLoading={actionLoading}
        okText={t("escrow.release") || "Release"}
        cancelText={t("common.cancel") || "Cancel"}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        {selectedEscrow && (
          <div>
            <p>
              {t("escrow.releaseConfirm") ||
                "Are you sure you want to release this escrow?"}
            </p>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                <strong>{t("escrow.id") || "Escrow ID"}:</strong>{" "}
                {selectedEscrow.id}
              </Text>
              <Text>
                <strong>{t("escrow.workerAmount") || "Worker Amount"}:</strong>{" "}
                ${Number(selectedEscrow.worker_amount_usd).toFixed(2)}
              </Text>
              <Text>
                <strong>{t("escrow.totalAmount") || "Total Amount"}:</strong> $
                {Number(selectedEscrow.total_amount_usd).toFixed(2)}
              </Text>
            </Space>
          </div>
        )}
      </Modal>

      {/* Resolve Complaint Modal */}
      <Modal
        title={t("escrow.resolveComplaint") || "Resolve Complaint"}
        open={resolveModalVisible}
        onOk={handleResolve}
        onCancel={() => {
          setResolveModalVisible(false);
          setSelectedEscrow(null);
          resolveForm.resetFields();
        }}
        confirmLoading={actionLoading}
        okText={t("escrow.resolve") || "Resolve"}
        cancelText={t("common.cancel") || "Cancel"}
        width={600}
        style={{ maxWidth: 700 }}
      >
        {selectedEscrow && (
          <Form
            form={resolveForm}
            layout="vertical"
            initialValues={{
              action: "release_to_worker",
            }}
          >
            <Form.Item
              name="action"
              label={t("escrow.resolutionAction") || "Resolution Action"}
              rules={[
                {
                  required: true,
                  message:
                    t("escrow.selectAction") ||
                    "Please select a resolution action",
                },
              ]}
            >
              <Radio.Group>
                <Radio value="release_to_worker">
                  {t("escrow.releaseToWorker") || "Release to Worker"}
                </Radio>
                <Radio value="refund_to_employer">
                  {t("escrow.refundToEmployer") || "Refund to Employer"}
                </Radio>
                <Radio value="partial_refund">
                  {t("escrow.partialRefund") || "Partial Refund"}
                </Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) =>
                prevValues.action !== currentValues.action
              }
            >
              {({ getFieldValue }) => {
                const action = getFieldValue("action");
                if (action === "partial_refund") {
                  return (
                    <>
                      <Form.Item
                        name="worker_amount"
                        label={
                          t("escrow.workerAmount") || "Worker Amount (USD)"
                        }
                        rules={[
                          {
                            required: true,
                            message:
                              t("escrow.workerAmountRequired") ||
                              "Worker amount is required",
                          },
                          {
                            type: "number",
                            min: 0,
                            message:
                              t("escrow.amountMustBePositive") ||
                              "Amount must be positive",
                          },
                        ]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          prefix="$"
                          precision={2}
                          min={0}
                          max={Number(selectedEscrow.total_amount_usd)}
                        />
                      </Form.Item>
                      <Form.Item
                        name="employer_refund"
                        label={
                          t("escrow.employerRefund") || "Employer Refund (USD)"
                        }
                        rules={[
                          {
                            required: true,
                            message:
                              t("escrow.employerRefundRequired") ||
                              "Employer refund is required",
                          },
                          {
                            type: "number",
                            min: 0,
                            message:
                              t("escrow.amountMustBePositive") ||
                              "Amount must be positive",
                          },
                        ]}
                      >
                        <InputNumber
                          style={{ width: "100%" }}
                          prefix="$"
                          precision={2}
                          min={0}
                          max={Number(selectedEscrow.total_amount_usd)}
                        />
                      </Form.Item>
                    </>
                  );
                }
                return null;
              }}
            </Form.Item>

            <Form.Item
              name="resolution_notes"
              label={t("escrow.resolutionNotes") || "Resolution Notes"}
              rules={[
                {
                  required: true,
                  message:
                    t("escrow.notesRequired") ||
                    "Resolution notes are required",
                },
                {
                  min: 10,
                  message:
                    t("escrow.notesMinLength") ||
                    "Notes must be at least 10 characters",
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder={
                  t("escrow.notesPlaceholder") ||
                  "Enter resolution details and reasoning..."
                }
              />
            </Form.Item>

            {selectedEscrow.complaint_description && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>
                  {t("escrow.complaintDescription") || "Complaint Description"}:
                </Text>
                <div
                  className="complaint-description-box"
                  style={{
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text>{selectedEscrow.complaint_description}</Text>
                </div>
              </div>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
}
