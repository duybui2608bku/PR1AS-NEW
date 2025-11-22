/**
 * Transaction History Component
 * Displays user's wallet transaction history
 * Usage: <TransactionHistory />
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Card,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { walletAPI, walletHelpers } from "@/lib/wallet/api-client";
import type {
  Transaction,
  TransactionType,
  TransactionStatus,
} from "@/lib/wallet/types";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

export default function TransactionHistory() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState<{
    type?: TransactionType[];
    status?: TransactionStatus[];
    dateRange?: [string, string];
  }>({});

  const loadTransactions = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const result = await walletAPI.getTransactions({
          type: filters.type,
          status: filters.status,
          date_from: filters.dateRange?.[0],
          date_to: filters.dateRange?.[1],
          page,
          limit: pagination.pageSize,
        });

        setTransactions(result.transactions);
        setPagination({
          ...pagination,
          current: result.page,
          total: result.total,
        });
      } catch (error: unknown) {
        message.error(
          (error as Error).message ?? t("wallet.transaction.failed")
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.pageSize, t]
  );

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const columns = [
    {
      title: t("wallet.transaction.date"),
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY HH:mm"),
      width: 200,
    },
    {
      title: t("wallet.transaction.type"),
      dataIndex: "type",
      key: "type",
      render: (type: TransactionType) => (
        <Tag
          color={
            type.includes("fee")
              ? "orange"
              : type === "earning"
              ? "green"
              : "blue"
          }
        >
          {walletHelpers.getTransactionTypeLabel(type)}
        </Tag>
      ),
      width: 150,
    },
    {
      title: t("wallet.transaction.amount"),
      dataIndex: "amount_usd",
      key: "amount_usd",
      render: (amount: number, record: Transaction) => (
        <span
          style={{
            color: ["deposit", "earning", "escrow_release", "refund"].includes(
              record.type
            )
              ? "#52c41a"
              : "#ff4d4f",
            fontWeight: "bold",
          }}
        >
          {["deposit", "earning", "escrow_release", "refund"].includes(
            record.type
          )
            ? "+"
            : "-"}
          {walletHelpers.formatUSD(amount)}
        </span>
      ),
      width: 120,
    },
    {
      title: t("wallet.transaction.status"),
      dataIndex: "status",
      key: "status",
      render: (status: TransactionStatus) => (
        <Tag color={walletHelpers.getTransactionStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
      width: 120,
    },
    {
      title: t("wallet.transaction.paymentMethod"),
      dataIndex: "payment_method",
      key: "payment_method",
      render: (method?: string) =>
        method ? <Tag>{method.replace("_", " ").toUpperCase()}</Tag> : "-",
      width: 220,
    },
    {
      title: t("wallet.transaction.description"),
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: t("wallet.transaction.balanceAfter"),
      dataIndex: "balance_after_usd",
      key: "balance_after_usd",
      render: (balance: number) => walletHelpers.formatUSD(balance),
      width: 150,
    },
  ];

  return (
    <Card
      title={t("wallet.transaction.title")}
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => loadTransactions(pagination.current)}
          loading={loading}
        >
          {t("wallet.transaction.refresh")}
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Filters */}
        <Space wrap>
          <Select
            style={{ width: 200 }}
            placeholder={t("wallet.transaction.filterByType")}
            mode="multiple"
            allowClear
            onChange={(value) =>
              setFilters({ ...filters, type: value as TransactionType[] })
            }
            options={[
              {
                label: t("wallet.transaction.types.deposit"),
                value: "deposit",
              },
              {
                label: t("wallet.transaction.types.withdrawal"),
                value: "withdrawal",
              },
              {
                label: t("wallet.transaction.types.payment"),
                value: "payment",
              },
              {
                label: t("wallet.transaction.types.earning"),
                value: "earning",
              },
              {
                label: t("wallet.transaction.types.platformFee"),
                value: "platform_fee",
              },
              { label: t("wallet.transaction.types.refund"), value: "refund" },
            ]}
          />
          <Select
            style={{ width: 150 }}
            placeholder={t("wallet.transaction.filterByStatus")}
            mode="multiple"
            allowClear
            onChange={(value) =>
              setFilters({ ...filters, status: value as TransactionStatus[] })
            }
            options={[
              {
                label: t("wallet.transaction.statuses.pending"),
                value: "pending",
              },
              {
                label: t("wallet.transaction.statuses.processing"),
                value: "processing",
              },
              {
                label: t("wallet.transaction.statuses.completed"),
                value: "completed",
              },
              {
                label: t("wallet.transaction.statuses.failed"),
                value: "failed",
              },
              {
                label: t("wallet.transaction.statuses.cancelled"),
                value: "cancelled",
              },
            ]}
          />
          <RangePicker
            onChange={(dates) => {
              if (dates) {
                setFilters({
                  ...filters,
                  dateRange: [
                    dates[0]?.toISOString() || "",
                    dates[1]?.toISOString() || "",
                  ],
                });
              } else {
                setFilters({ ...filters, dateRange: undefined });
              }
            }}
          />
        </Space>

        {/* Table */}
        <Table
          dataSource={transactions}
          columns={columns}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) =>
              t("wallet.transaction.total", { count: total }),
            onChange: (page, pageSize) => {
              setPagination({ ...pagination, current: page, pageSize });
              loadTransactions(page);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Space>
    </Card>
  );
}
