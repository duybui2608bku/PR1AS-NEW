/**
 * Wallet Balance Component
 * Displays user's wallet balance and quick actions
 * Usage: <WalletBalance />
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Statistic, Button, Space, message } from "antd";
import {
  WalletOutlined,
  PlusOutlined,
  MinusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { walletAPI } from "@/lib/wallet/api-client";
import type { Wallet, WalletSummary } from "@/lib/wallet/types";
import { getErrorMessage } from "@/lib/utils/common";
import Loading from "@/components/common/Loading";

interface WalletBalanceProps {
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export default function WalletBalance({
  onDeposit,
  onWithdraw,
}: WalletBalanceProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [summary, setSummary] = useState<WalletSummary | null>(null);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getBalance();
      setWallet(data.wallet);
      setSummary(data.summary);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Unknown error");
      if (errorMessage === "Not authenticated") {
        message.error(t("wallet.balance.loginRequired"));
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 2000);
      } else {
        message.error(errorMessage || t("wallet.balance.failed"));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  if (loading) {
    return (
      <Card>
        <Loading
          variant="inline"
          size="large"
          tip={t("wallet.balance.loading")}
        />
      </Card>
    );
  }

  if (!wallet || !summary) {
    return (
      <Card>
        <p>{t("wallet.balance.failed")}</p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <WalletOutlined />
          <span>{t("wallet.myWallet")}</span>
        </Space>
      }
      extra={
        <Button
          icon={<SyncOutlined />}
          onClick={loadWalletData}
          loading={loading}
          type="text"
        >
          {t("wallet.balance.refresh")}
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Available Balance */}
        <Statistic
          title={t("wallet.balance.available")}
          value={summary.available_balance}
          precision={2}
          prefix="$"
          valueStyle={{ color: "#3f8600", fontSize: "2em", fontWeight: "bold" }}
        />

        {/* Additional Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          <Statistic
            title={t("wallet.balance.pending")}
            value={summary.pending_balance}
            precision={2}
            prefix="$"
            valueStyle={{ fontSize: "1.2em" }}
          />
          <Statistic
            title={t("wallet.balance.totalEarned")}
            value={summary.total_earned}
            precision={2}
            prefix="$"
            valueStyle={{ fontSize: "1.2em", color: "#52c41a" }}
          />
          <Statistic
            title={t("wallet.balance.activeEscrows")}
            value={summary.active_escrows}
            valueStyle={{ fontSize: "1.2em" }}
          />
          <Statistic
            title={t("wallet.balance.totalSpent")}
            value={summary.total_spent}
            precision={2}
            prefix="$"
            valueStyle={{ fontSize: "1.2em", color: "#8c8c8c" }}
          />
        </div>

        {/* Actions */}
        <Space style={{ width: "100%", justifyContent: "center" }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={onDeposit}
          >
            {t("wallet.balance.deposit")}
          </Button>
          <Button
            icon={<MinusOutlined />}
            size="large"
            onClick={onWithdraw}
            disabled={summary.available_balance <= 0}
          >
            {t("wallet.balance.withdraw")}
          </Button>
        </Space>

        {/* Wallet Status */}
        <div
          style={{ textAlign: "center", fontSize: "12px", color: "#8c8c8c" }}
        >
          {t("wallet.balance.status")}:{" "}
          <strong
            style={{
              color: wallet.status === "active" ? "#52c41a" : "#ff4d4f",
            }}
          >
            {wallet.status === "active"
              ? t("wallet.balance.active").toUpperCase()
              : wallet.status.toUpperCase()}
          </strong>
        </div>
      </Space>
    </Card>
  );
}
