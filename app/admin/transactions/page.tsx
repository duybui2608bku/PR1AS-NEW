"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Input,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Modal,
  Descriptions,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  TransactionOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/lib/wallet/types";
import { adminWalletAPI } from "@/lib/admin/wallet-api";
import { showNotification } from "@/lib/utils/toast";
import { getTransactionStatusColor } from "@/lib/admin/utils";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface TransactionFilters {
  type?: TransactionType[];
  status?: TransactionStatus[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export default function TransactionsManagementPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [stats, setStats] = useState({
    total_transactions: 0,
    total_amount: 0,
    total_deposits: 0,
    total_withdrawals: 0,
    total_payments: 0,
  });
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { transactions, stats: newStats } =
        await adminWalletAPI.getTransactions({
          ...filters,
          search: filters.search?.trim() || undefined,
        });
      setTransactions(transactions);
      setStats(newStats || stats);
    } catch {
      showNotification.error(
        "Không thể tải danh sách giao dịch",
        "Vui lòng thử lại sau. Nếu lỗi tiếp tục xảy ra, hãy liên hệ quản trị viên."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);


  const getTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      deposit: t("transactions.types.deposit") || "Deposit",
      withdrawal: t("transactions.types.withdrawal") || "Withdrawal",
      payment: t("transactions.types.payment") || "Payment",
      earning: t("transactions.types.earning") || "Earning",
      platform_fee: t("transactions.types.platformFee") || "Platform Fee",
      insurance_fee: t("transactions.types.insuranceFee") || "Insurance Fee",
      refund: t("transactions.types.refund") || "Refund",
      escrow_hold: t("transactions.types.escrowHold") || "Escrow Hold",
      escrow_release: t("transactions.types.escrowRelease") || "Escrow Release",
    };
    return labels[type] || type;
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: t("transactions.table.id") || "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: t("transactions.table.user") || "User",
      dataIndex: "user_id",
      key: "user_id",
      width: 100,
      render: (userId: string) => <Text code>{userId.slice(0, 8)}...</Text>,
    },
    {
      title: t("transactions.table.type") || "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: TransactionType) => (
        <Tag
          color={type === "deposit" || type === "earning" ? "green" : "blue"}
        >
          {getTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: t("transactions.table.amount") || "Amount",
      dataIndex: "amount_usd",
      key: "amount_usd",
      width: 120,
      align: "right",
      render: (amount: number) => (
        <Text strong style={{ color: amount >= 0 ? "#3f8600" : "#cf1322" }}>
          {amount >= 0 ? "+" : ""}${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: t("transactions.table.status") || "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: TransactionStatus) => (
        <Tag color={getTransactionStatusColor(status)}>
          {t(`transactions.status.${status}`) || status}
        </Tag>
      ),
    },
    {
      title: t("transactions.table.paymentMethod") || "Payment Method",
      dataIndex: "payment_method",
      key: "payment_method",
      width: 120,
      render: (method: string) => method || "-",
    },
    {
      title: t("transactions.table.description") || "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: t("transactions.table.createdAt") || "Created At",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: t("common.actions") || "Actions",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_: unknown, record: Transaction) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedTransaction(record);
            setDetailModalVisible(true);
          }}
        >
          {t("common.view") || "View"}
        </Button>
      ),
    },
  ];

  const handleDateRangeChange = (
    dates: [Dayjs | null, Dayjs | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setFilters({
        ...filters,
        date_from: dates[0].startOf("day").toISOString(),
        date_to: dates[1].endOf("day").toISOString(),
      });
    } else {
      setFilters({
        ...filters,
        date_from: undefined,
        date_to: undefined,
      });
    }
  };

  return (
    <div>
      <Title level={2}>
        {t("admin.transactions.title") || "Transaction Management"}
      </Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                t("transactions.stats.totalTransactions") ||
                "Total Transactions"
              }
              value={stats.total_transactions}
              prefix={<TransactionOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("transactions.stats.totalAmount") || "Total Amount"}
              value={stats.total_amount}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("transactions.stats.totalDeposits") || "Total Deposits"}
              value={stats.total_deposits}
              prefix={<ArrowDownOutlined />}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                t("transactions.stats.totalWithdrawals") || "Total Withdrawals"
              }
              value={stats.total_withdrawals}
              prefix={<ArrowUpOutlined />}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap style={{ width: "100%" }}>
          <Input
            placeholder={t("common.search") || "Search..."}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder={t("transactions.filters.type") || "Transaction Type"}
            style={{ width: 200 }}
            onChange={(value) =>
              setFilters({ ...filters, type: value as TransactionType[] })
            }
            allowClear
          >
            <Select.Option value="deposit">
              {t("transactions.types.deposit") || "Deposit"}
            </Select.Option>
            <Select.Option value="withdrawal">
              {t("transactions.types.withdrawal") || "Withdrawal"}
            </Select.Option>
            <Select.Option value="payment">
              {t("transactions.types.payment") || "Payment"}
            </Select.Option>
            <Select.Option value="earning">
              {t("transactions.types.earning") || "Earning"}
            </Select.Option>
            <Select.Option value="escrow_hold">
              {t("transactions.types.escrowHold") || "Escrow Hold"}
            </Select.Option>
            <Select.Option value="escrow_release">
              {t("transactions.types.escrowRelease") || "Escrow Release"}
            </Select.Option>
          </Select>
          <Select
            mode="multiple"
            placeholder={t("transactions.filters.status") || "Status"}
            style={{ width: 200 }}
            onChange={(value) =>
              setFilters({ ...filters, status: value as TransactionStatus[] })
            }
            allowClear
          >
            <Select.Option value="pending">
              {t("transactions.status.pending") || "Pending"}
            </Select.Option>
            <Select.Option value="processing">
              {t("transactions.status.processing") || "Processing"}
            </Select.Option>
            <Select.Option value="completed">
              {t("transactions.status.completed") || "Completed"}
            </Select.Option>
            <Select.Option value="failed">
              {t("transactions.status.failed") || "Failed"}
            </Select.Option>
          </Select>
          <RangePicker
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={[
              t("transactions.filters.dateFrom") || "From",
              t("transactions.filters.dateTo") || "To",
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchTransactions}>
            {t("common.refresh") || "Refresh"}
          </Button>
        </Space>
      </Card>

      {/* Transactions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) =>
              `${t("common.total") || "Total"} ${total} ${
                t("transactions.table.records") || "records"
              }`,
          }}
        />
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
        title={t("transactions.detail") || "Transaction Details"}
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedTransaction(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedTransaction(null);
            }}
          >
            {t("common.close") || "Close"}
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: 700 }}
      >
        {selectedTransaction && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label={t("transactions.table.id") || "ID"}>
              <Text code>{selectedTransaction.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.table.user") || "User ID"}>
              <Text code>{selectedTransaction.user_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.table.wallet") || "Wallet ID"}>
              <Text code>{selectedTransaction.wallet_id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.table.type") || "Type"}>
              <Tag
                color={
                  selectedTransaction.type === "deposit" ||
                  selectedTransaction.type === "earning"
                    ? "green"
                    : "blue"
                }
              >
                {getTypeLabel(selectedTransaction.type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.table.amount") || "Amount"}>
              <Text
                strong
                style={{
                  color: selectedTransaction.amount_usd >= 0 ? "#3f8600" : "#cf1322",
                  fontSize: 16,
                }}
              >
                {selectedTransaction.amount_usd >= 0 ? "+" : ""}$
                {selectedTransaction.amount_usd.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.table.status") || "Status"}>
              <Tag color={getTransactionStatusColor(selectedTransaction.status)}>
                {t(`transactions.status.${selectedTransaction.status}`) ||
                  selectedTransaction.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item
              label={t("transactions.balanceBefore") || "Balance Before"}
            >
              ${selectedTransaction.balance_before_usd.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item
              label={t("transactions.balanceAfter") || "Balance After"}
            >
              <Text strong>
                ${selectedTransaction.balance_after_usd.toFixed(2)}
              </Text>
            </Descriptions.Item>
            {selectedTransaction.payment_method && (
              <Descriptions.Item
                label={t("transactions.table.paymentMethod") || "Payment Method"}
              >
                {selectedTransaction.payment_method}
              </Descriptions.Item>
            )}
            {selectedTransaction.payment_gateway_id && (
              <Descriptions.Item
                label={t("transactions.gatewayId") || "Gateway ID"}
              >
                <Text code>{selectedTransaction.payment_gateway_id}</Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.escrow_id && (
              <Descriptions.Item label={t("transactions.escrowId") || "Escrow ID"}>
                <Text code>{selectedTransaction.escrow_id}</Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.job_id && (
              <Descriptions.Item label={t("transactions.jobId") || "Job ID"}>
                <Text code>{selectedTransaction.job_id}</Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.related_user_id && (
              <Descriptions.Item
                label={t("transactions.relatedUserId") || "Related User ID"}
              >
                <Text code>{selectedTransaction.related_user_id}</Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.description && (
              <Descriptions.Item
                label={t("transactions.table.description") || "Description"}
              >
                {selectedTransaction.description}
              </Descriptions.Item>
            )}
            {selectedTransaction.metadata && (
              <Descriptions.Item label={t("transactions.metadata") || "Metadata"}>
                <pre style={{ margin: 0, maxHeight: 200, overflow: "auto" }}>
                  {JSON.stringify(selectedTransaction.metadata, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t("transactions.table.createdAt") || "Created At"}>
              {dayjs(selectedTransaction.created_at).format(
                "YYYY-MM-DD HH:mm:ss"
              )}
            </Descriptions.Item>
            {selectedTransaction.completed_at && (
              <Descriptions.Item
                label={t("transactions.completedAt") || "Completed At"}
              >
                {dayjs(selectedTransaction.completed_at).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </Descriptions.Item>
            )}
            {selectedTransaction.failed_at && (
              <Descriptions.Item label={t("transactions.failedAt") || "Failed At"}>
                {dayjs(selectedTransaction.failed_at).format("YYYY-MM-DD HH:mm:ss")}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
