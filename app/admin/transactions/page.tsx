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
  Avatar,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  TransactionOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
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
import { adminUserAPI, type User } from "@/lib/admin/user-api";
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
  const [userLookup, setUserLookup] = useState<Record<string, User>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserLookup = async (userIds: string[]) => {
    if (userIds.length === 0) return;

    try {
      // Fetch all users and create lookup map
      const response = await adminUserAPI.getAllUsers({ limit: 1000 });
      if (response.data?.users) {
        const lookup: Record<string, User> = {};
        response.data.users.forEach((user) => {
          lookup[user.id] = user;
        });
        setUserLookup((prev) => ({ ...prev, ...lookup }));
      }
    } catch (error) {
      // Silently fail - user lookup is not critical
      console.error("Failed to fetch user lookup:", error);
    }
  };

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

      // Fetch user lookup for unique user IDs
      const uniqueUserIds = [
        ...new Set(transactions.map((t) => t.user_id)),
      ].filter((id) => !userLookup[id]);
      if (uniqueUserIds.length > 0) {
        await fetchUserLookup(uniqueUserIds);
      }
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

  const getPaymentMethodLabel = (method?: string) => {
    if (!method) return "-";
    const translationKey = `wallet.transaction.paymentMethods.${method}`;
    const translated = t(translationKey);
    // If translation exists and is different from key, use it
    if (translated && translated !== translationKey) {
      return translated;
    }
    return method;
  };

  const renderMetadata = (metadata: Record<string, unknown>) => {
    // Check if metadata has destination (bank transfer info)
    if (metadata.destination && typeof metadata.destination === "object") {
      const destination = metadata.destination as Record<string, unknown>;
      const bankName = destination.bank_name
        ? String(destination.bank_name)
        : null;
      const bankAccount = destination.bank_account
        ? String(destination.bank_account)
        : null;
      const accountHolder = destination.account_holder
        ? String(destination.account_holder)
        : null;

      return (
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          {bankName && (
            <div>
              <Text strong>
                {t("wallet.withdraw.bankName") || "Tên ngân hàng"}:{" "}
              </Text>
              <Text>{bankName}</Text>
            </div>
          )}
          {bankAccount && (
            <div>
              <Text strong>
                {t("wallet.withdraw.accountNumber") || "Số tài khoản"}:{" "}
              </Text>
              <Text code>{bankAccount}</Text>
            </div>
          )}
          {accountHolder && (
            <div>
              <Text strong>
                {t("wallet.withdraw.accountHolder") || "Tên chủ tài khoản"}:{" "}
              </Text>
              <Text>{accountHolder}</Text>
            </div>
          )}
          {metadata.requires_manual_processing !== undefined && (
            <div>
              <Text strong>
                {t("transactions.requiresManualProcessing") ||
                  "Yêu cầu xử lý thủ công"}
                :{" "}
              </Text>
              <Tag
                color={
                  Boolean(metadata.requires_manual_processing)
                    ? "orange"
                    : "green"
                }
              >
                {Boolean(metadata.requires_manual_processing) ? "Có" : "Không"}
              </Tag>
            </div>
          )}
          {/* Show other metadata fields if any */}
          {Object.keys(metadata).some(
            (key) =>
              key !== "destination" && key !== "requires_manual_processing"
          ) && (
            <div style={{ marginTop: 8 }}>
              <Text strong style={{ fontSize: 12 }}>
                {t("transactions.otherMetadata") || "Thông tin khác"}:
              </Text>
              <pre
                style={{
                  margin: "8px 0 0 0",
                  padding: 8,
                  background: "#f5f5f5",
                  borderRadius: 4,
                  fontSize: 12,
                  maxHeight: 150,
                  overflow: "auto",
                }}
              >
                {JSON.stringify(
                  Object.fromEntries(
                    Object.entries(metadata).filter(
                      ([key]) =>
                        key !== "destination" &&
                        key !== "requires_manual_processing"
                    )
                  ),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </Space>
      );
    }

    // Fallback to JSON display for other metadata structures
    return (
      <pre style={{ margin: 0, maxHeight: 200, overflow: "auto" }}>
        {JSON.stringify(metadata, null, 2)}
      </pre>
    );
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: t("transactions.table.id") || "ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
    },
    {
      title: t("transactions.table.user") || "User",
      dataIndex: "user_id",
      key: "user_id",
      width: 250,
      render: (userId: string) => {
        const user = userLookup[userId];
        if (user) {
          const fullName =
            user.user_metadata?.full_name ||
            user.profile?.full_name ||
            user.email;
          const email = user.email;
          return (
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <Space direction="vertical" size={0}>
                <Text strong>{fullName}</Text>
                {fullName !== email && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {email}
                  </Text>
                )}
              </Space>
            </Space>
          );
        }
        return <Text code>{userId.slice(0, 8)}...</Text>;
      },
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
      width: 200,
      render: (method?: string) => {
        const label = getPaymentMethodLabel(method);
        return label === "-" ? (
          <Text type="secondary">-</Text>
        ) : (
          <Tag>{label}</Tag>
        );
      },
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
      width: 150,
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
          {t("admin.users.viewDetails") || "View"}
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

  const handleCompleteWithdrawal = async () => {
    if (!selectedTransaction) return;

    setActionLoading(true);
    try {
      const updatedTransaction = await adminWalletAPI.completeWithdrawal(
        selectedTransaction.id
      );
      showNotification.success(
        t("transactions.withdrawalCompleted") || "Hoàn tất rút tiền",
        t("transactions.withdrawalCompletedSuccess") ||
          "Giao dịch rút tiền đã được hoàn tất thành công"
      );
      // Update selected transaction to reflect new status
      setSelectedTransaction(updatedTransaction);
      // Refresh transactions list
      await fetchTransactions();
    } catch (error: any) {
      showNotification.error(
        t("transactions.completeError") || "Hoàn tất thất bại",
        error.message ||
          t("transactions.completeErrorMsg") ||
          "Không thể hoàn tất giao dịch rút tiền"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Check if transaction can be completed (withdrawal with pending/processing status)
  const canCompleteWithdrawal = (transaction: Transaction | null) => {
    if (!transaction) return false;
    return (
      transaction.type === "withdrawal" &&
      (transaction.status === "pending" || transaction.status === "processing")
    );
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
          canCompleteWithdrawal(selectedTransaction) && (
            <Button
              key="complete"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={actionLoading}
              onClick={handleCompleteWithdrawal}
            >
              {t("transactions.completeWithdrawal") || "Hoàn tất rút tiền"}
            </Button>
          ),
          <Button
            key="close"
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedTransaction(null);
            }}
          >
            {t("common.close") || "Close"}
          </Button>,
        ].filter(Boolean)}
        width="95%"
        style={{ maxWidth: 1000 }}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label={t("transactions.table.id") || "ID"}>
              <Text code>{selectedTransaction.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.table.user") || "User"}>
              {(() => {
                const user = userLookup[selectedTransaction.user_id];
                if (user) {
                  const fullName =
                    user.user_metadata?.full_name ||
                    user.profile?.full_name ||
                    user.email;
                  return (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Space direction="vertical" size={0}>
                        <Text strong>{fullName}</Text>
                        {fullName !== user.email && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {user.email}
                          </Text>
                        )}
                        <Text code style={{ fontSize: 11 }}>
                          {selectedTransaction.user_id}
                        </Text>
                      </Space>
                    </Space>
                  );
                }
                return <Text code>{selectedTransaction.user_id}</Text>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label={t("transactions.wallet") || "Wallet ID"}>
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
            <Descriptions.Item
              label={t("transactions.table.amount") || "Amount"}
            >
              <Text
                strong
                style={{
                  color:
                    selectedTransaction.amount_usd >= 0 ? "#3f8600" : "#cf1322",
                  fontSize: 16,
                }}
              >
                {selectedTransaction.amount_usd >= 0 ? "+" : ""}$
                {selectedTransaction.amount_usd.toFixed(2)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={t("transactions.table.status") || "Status"}
            >
              <Tag
                color={getTransactionStatusColor(selectedTransaction.status)}
              >
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
                label={
                  t("transactions.table.paymentMethod") || "Payment Method"
                }
              >
                <Tag>
                  {getPaymentMethodLabel(selectedTransaction.payment_method)}
                </Tag>
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
              <Descriptions.Item
                label={t("transactions.escrowId") || "Escrow ID"}
              >
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
                span={2}
              >
                {selectedTransaction.description}
              </Descriptions.Item>
            )}
            {selectedTransaction.metadata && (
              <Descriptions.Item
                label={t("transactions.metadata") || "Metadata"}
                span={2}
              >
                {renderMetadata(selectedTransaction.metadata)}
              </Descriptions.Item>
            )}
            <Descriptions.Item
              label={t("transactions.table.createdAt") || "Created At"}
            >
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
              <Descriptions.Item
                label={t("transactions.failedAt") || "Failed At"}
              >
                {dayjs(selectedTransaction.failed_at).format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
