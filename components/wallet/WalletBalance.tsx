/**
 * Wallet Balance Component
 * Displays user's wallet balance and quick actions
 * Usage: <WalletBalance />
 */

"use client";

import { Card, Statistic, Button, Space } from "antd";
import {
  WalletOutlined,
  PlusOutlined,
  MinusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import Loading from "@/components/common/Loading";
import { useWalletBalance } from "@/hooks/wallet/useWallet";
import { useRouter } from "next/navigation";

interface WalletBalanceProps {
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export default function WalletBalance({
  onDeposit,
  onWithdraw,
}: WalletBalanceProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // Use React Query hook
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useWalletBalance();

  // Handle authentication error
  if (error && error.message === "Not authenticated") {
    showMessage.error(t("wallet.balance.loginRequired"));
    setTimeout(() => {
      router.push("/auth/login");
    }, 2000);
  }

  const wallet = data?.wallet || null;
  const summary = data?.summary || null;

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
          onClick={() => refetch()}
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
