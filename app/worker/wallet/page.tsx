"use client";

import React, { useState } from "react";
import { Row, Col, Typography, Space } from "antd";
import { useTranslation } from "react-i18next";
import WalletBalance from "@/components/wallet/WalletBalance";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import DepositModal from "@/components/wallet/DepositModal";
import WithdrawModal from "@/components/wallet/WithdrawModal";

const { Title } = Typography;

export default function WorkerWalletPage() {
  const { t } = useTranslation();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDepositSuccess = () => {
    // Refresh wallet balance and transaction history
    setRefreshKey((prev) => prev + 1);
  };

  const handleWithdrawSuccess = () => {
    // Refresh wallet balance and transaction history
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div>
      <Title level={2}>{t("wallet.title")}</Title>

      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Wallet Balance */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12} xl={10}>
            <WalletBalance
              key={`wallet-${refreshKey}`}
              onDeposit={() => setDepositModalOpen(true)}
              onWithdraw={() => setWithdrawModalOpen(true)}
            />
          </Col>
        </Row>

        {/* Transaction History */}
        <TransactionHistory key={`history-${refreshKey}`} />
      </Space>

      {/* Modals */}
      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />
      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}
