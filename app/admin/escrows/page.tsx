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
} from "antd";
import {
  ReloadOutlined,
  AlertOutlined,
  DollarOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { EscrowHold, EscrowStatus } from "@/lib/wallet/types";
import { adminWalletAPI } from "@/lib/admin/wallet-api";
import { showNotification } from "@/lib/utils/toast";

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

  const fetchEscrows = async () => {
    setLoading(true);
    try {
      const { escrows: list, pagination } = await adminWalletAPI.getEscrows(
        filters
      );
      setEscrows(list);
      const total_count = pagination?.total || list.length;
      const total_held = list
        .filter((e) => e.status === "held")
        .reduce((sum, e) => sum + Number(e.total_amount_usd), 0);
      const total_released = list
        .filter((e) => e.status === "released")
        .reduce((sum, e) => sum + Number(e.total_amount_usd), 0);
      const total_disputed = list
        .filter((e) => e.status === "disputed")
        .reduce((sum, e) => sum + Number(e.total_amount_usd), 0);
      setStats({
        total_held,
        total_released,
        total_disputed,
        total_count,
      });
    } catch {
      showNotification.error(
        "Không thể tải danh sách escrow",
        "Vui lòng thử lại sau. Nếu lỗi tiếp tục xảy ra, hãy liên hệ quản trị viên."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscrows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const getStatusColor = (status: EscrowStatus) => {
    const colors: Record<EscrowStatus, string> = {
      held: "blue",
      released: "green",
      refunded: "purple",
      disputed: "volcano",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  const columns: ColumnsType<EscrowHold> = [
    {
      title: t("escrow.table.id") || "ID",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: t("escrow.table.jobId") || "Booking / Job",
      dataIndex: "job_id",
      key: "job_id",
      width: 140,
      render: (jobId?: string) =>
        jobId ? <Text code>{jobId.slice(0, 8)}...</Text> : "-",
    },
    {
      title: t("escrow.table.employer") || "Client (Employer)",
      dataIndex: "employer_id",
      key: "employer_id",
      width: 140,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: t("escrow.table.worker") || "Worker",
      dataIndex: "worker_id",
      key: "worker_id",
      width: 140,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
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
        <Tag color={getStatusColor(status)}>
          {t(`escrow.status.${status}`) || status}
        </Tag>
      ),
    },
    {
      title: t("escrow.table.hasComplaint") || "Complaint",
      dataIndex: "has_complaint",
      key: "has_complaint",
      width: 110,
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
  ];

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
    </div>
  );
}
