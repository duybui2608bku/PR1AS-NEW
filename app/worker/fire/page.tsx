"use client";

import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  InputNumber,
  Table,
  Tag,
  message,
  Statistic,
  Space,
} from "antd";
import {
  FireOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  getFireBalance,
  purchaseFire,
  claimDailyLogin,
  activateBoost,
  getFireTransactions,
} from "@/lib/fire/api-client";
import { walletAPI } from "@/lib/wallet/api-client";
import {
  FireBoostType,
  FIRE_BOOST_CONFIG,
  FIRE_CONFIG,
  ActiveBoostInfo,
  FireTransaction,
} from "@/lib/fire/types";
import dayjs from "dayjs";

export default function FireDashboardPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [activeBoosts, setActiveBoosts] = useState<ActiveBoostInfo[]>([]);
  const [transactions, setTransactions] = useState<FireTransaction[]>([]);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(10);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    loadData();
    // Refresh every minute to update countdown
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load wallet balance when purchase modal opens
  useEffect(() => {
    if (purchaseModalVisible) {
      loadWalletBalance();
    }
  }, [purchaseModalVisible]);

  const loadData = async () => {
    try {
      const [balanceRes, txRes] = await Promise.all([
        getFireBalance(),
        getFireTransactions({ per_page: 10 }),
      ]);

      if (balanceRes.success && balanceRes.data) {
        setBalance(balanceRes.data.total_fires);
        setActiveBoosts(balanceRes.data.active_boosts);
      }

      if (txRes.success && txRes.data) {
        setTransactions(txRes.data.transactions);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      setWalletLoading(true);
      const walletData = await walletAPI.getBalance();

      // Check if wallet data exists and has required properties
      if (walletData && walletData.wallet) {
        setWalletBalance(walletData.wallet.balance_usd || 0);
      } else {
        console.warn("Wallet data is missing or invalid:", walletData);
        setWalletBalance(0);
      }
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
      setWalletBalance(0);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleDailyLogin = async () => {
    try {
      setLoading(true);
      const response = await claimDailyLogin();

      if (response.success && response.data) {
        if (response.data.already_claimed_today) {
          message.info(t("fire.notifications.dailyLoginAlready"));
        } else {
          message.success(
            t("fire.notifications.dailyLoginSuccess").replace(
              "{amount}",
              response.data.fires_awarded.toString()
            )
          );
          setBalance(response.data.new_balance);
          loadData();
        }
      }
    } catch (error: any) {
      message.error(error.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if ((walletBalance || 0) < (purchaseAmount || 0)) {
      message.error(t("fire.purchase.insufficientBalance"));
      return;
    }

    try {
      setLoading(true);
      const response = await purchaseFire(purchaseAmount);

      if (response.success && response.data) {
        message.success(
          t("fire.notifications.purchaseSuccess").replace(
            "{amount}",
            purchaseAmount.toString()
          )
        );
        setBalance(response.data.new_balance);
        setPurchaseModalVisible(false);
        loadData();
        loadWalletBalance(); // Refresh wallet balance
      } else {
        const errorMessage = response.error || t("fire.purchase.error");
        console.error("Purchase failed:", errorMessage);
        message.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || t("fire.purchase.error");
      console.error("Purchase error:", error);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateBoost = async (boostType: FireBoostType) => {
    const config = FIRE_BOOST_CONFIG[boostType];

    if (balance < config.cost) {
      message.error(
        t("fire.boost.insufficientMessage")
          .replace("{required}", config.cost.toString())
          .replace("{current}", balance.toString())
      );
      return;
    }

    Modal.confirm({
      title: t("fire.boost.confirmTitle"),
      content: t("fire.boost.confirmMessage")
        .replace("{cost}", config.cost.toString())
        .replace(
          "{type}",
          boostType === FireBoostType.FEATURED_RECOMMENDATION
            ? t("fire.boost.featured")
            : t("fire.boost.topProfile")
        ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await activateBoost(boostType);

          if (response.success && response.data) {
            message.success(
              t("fire.notifications.boostActivated").replace(
                "{type}",
                boostType
              )
            );
            setBalance(response.data.new_balance);
            loadData();
          } else {
            message.error(
              response.error ||
                t("fire.notifications.boostError").replace("{error}", "Unknown")
            );
          }
        } catch (error: any) {
          message.error(
            t("fire.notifications.boostError").replace("{error}", error.message)
          );
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const transactionColumns = [
    {
      title: t("fire.history.type"),
      dataIndex: "transaction_type",
      key: "type",
      render: (type: string) => {
        const colors: Record<string, string> = {
          purchase: "green",
          daily_login: "blue",
          boost_featured: "orange",
          boost_top_profile: "orange",
          admin_adjustment: "purple",
          refund: "green",
        };
        return (
          <Tag color={colors[type] || "default"}>
            {t(`fire.history.types.${type}`)}
          </Tag>
        );
      },
    },
    {
      title: t("fire.history.amount"),
      dataIndex: "fires_amount",
      key: "amount",
      render: (amount: number) => (
        <span
          style={{
            color: amount > 0 ? "#52c41a" : "#ff4d4f",
            fontWeight: "bold",
          }}
        >
          {amount > 0 ? "+" : ""}
          {amount}
        </span>
      ),
    },
    {
      title: t("fire.history.balance"),
      dataIndex: "fires_after",
      key: "balance",
    },
    {
      title: t("fire.history.date"),
      dataIndex: "created_at",
      key: "date",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ];

  const hasActiveBoost = (boostType: FireBoostType) => {
    return activeBoosts.some((b) => b.boost_type === boostType);
  };

  const getBoostTimeRemaining = (boostType: FireBoostType) => {
    const boost = activeBoosts.find((b) => b.boost_type === boostType);
    const timeRemaining = boost?.time_remaining_display || "0m";
    return timeRemaining;
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>
        <FireOutlined style={{ color: "#ff4d4f" }} />{" "}
        {t("fire.dashboard.title")}
      </h1>
      <p style={{ marginBottom: 24, fontSize: 16 }}>
        {t("fire.dashboard.subtitle")}
      </p>

      {/* Balance Card */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card>
            <Statistic
              title={t("fire.balance")}
              value={balance}
              prefix={<FireOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f", fontSize: 48 }}
              suffix={
                <Button
                  type="primary"
                  onClick={() => setPurchaseModalVisible(true)}
                  style={{ marginLeft: 16 }}
                >
                  {t("fire.purchaseFire")}
                </Button>
              }
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t("fire.dashboard.earnFire")}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <ClockCircleOutlined />{" "}
                {t("fire.dashboard.dailyLoginReward").replace(
                  "{amount}",
                  FIRE_CONFIG.DAILY_LOGIN_REWARD.toString()
                )}
              </div>
              <Button
                type="dashed"
                onClick={handleDailyLogin}
                loading={loading}
                block
              >
                {t("fire.claimReward")}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Boost Cards */}
      <h2>{t("fire.boost.title")}</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <RocketOutlined /> {t("fire.boost.featured")}
              </span>
            }
            extra={
              hasActiveBoost(FireBoostType.FEATURED_RECOMMENDATION) ? (
                <Tag color="green">{t("fire.boost.active")}</Tag>
              ) : null
            }
          >
            <p>{t("fire.boost.featuredDescription")}</p>
            <div style={{ marginBottom: 16 }}>
              <strong>
                {FIRE_BOOST_CONFIG[FireBoostType.FEATURED_RECOMMENDATION].cost}{" "}
                {t("fire.fireUnit")}
              </strong>
              {" • "}
              <span>
                {
                  FIRE_BOOST_CONFIG[FireBoostType.FEATURED_RECOMMENDATION]
                    .durationHours
                }{" "}
                {t("fire.boost.hours")}
              </span>
            </div>

            {hasActiveBoost(FireBoostType.FEATURED_RECOMMENDATION) && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: "#f6ffed",
                  borderRadius: 4,
                }}
              >
                <ClockCircleOutlined />{" "}
                {t("fire.boost.timeRemaining").replace(
                  "{time}",
                  getBoostTimeRemaining(FireBoostType.FEATURED_RECOMMENDATION)
                )}
              </div>
            )}

            <Button
              type="primary"
              danger
              onClick={() =>
                handleActivateBoost(FireBoostType.FEATURED_RECOMMENDATION)
              }
              loading={loading}
              disabled={
                balance <
                FIRE_BOOST_CONFIG[FireBoostType.FEATURED_RECOMMENDATION].cost
              }
              block
            >
              {hasActiveBoost(FireBoostType.FEATURED_RECOMMENDATION)
                ? t("fire.boost.extend")
                : t("fire.boost.activate")}
            </Button>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span>
                <StarOutlined /> {t("fire.boost.topProfile")}
              </span>
            }
            extra={
              hasActiveBoost(FireBoostType.TOP_PROFILE) ? (
                <Tag color="gold">{t("fire.boost.active")}</Tag>
              ) : null
            }
          >
            <p>{t("fire.boost.topProfileDescription")}</p>
            <div style={{ marginBottom: 16 }}>
              <strong>
                {FIRE_BOOST_CONFIG[FireBoostType.TOP_PROFILE].cost}{" "}
                {t("fire.fireUnit")}
              </strong>
              {" • "}
              <span>
                {FIRE_BOOST_CONFIG[FireBoostType.TOP_PROFILE].durationHours}{" "}
                {t("fire.boost.hours")}
              </span>
            </div>

            {hasActiveBoost(FireBoostType.TOP_PROFILE) && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 12,
                  background: "#fffbe6",
                  borderRadius: 4,
                }}
              >
                <ClockCircleOutlined />{" "}
                {t("fire.boost.timeRemaining").replace(
                  "{time}",
                  getBoostTimeRemaining(FireBoostType.TOP_PROFILE)
                )}
              </div>
            )}

            <Button
              type="primary"
              style={{ background: "#faad14", borderColor: "#faad14" }}
              onClick={() => handleActivateBoost(FireBoostType.TOP_PROFILE)}
              loading={loading}
              disabled={
                balance < FIRE_BOOST_CONFIG[FireBoostType.TOP_PROFILE].cost
              }
              block
            >
              {hasActiveBoost(FireBoostType.TOP_PROFILE)
                ? t("fire.boost.extend")
                : t("fire.boost.activate")}
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Transaction History */}
      <Card
        title={
          <>
            <TrophyOutlined /> {t("fire.history.title")}
          </>
        }
      >
        <Table
          dataSource={transactions}
          columns={transactionColumns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: t("fire.history.noTransactions") }}
        />
      </Card>

      {/* Purchase Modal */}
      <Modal
        title={t("fire.purchase.title")}
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
        onOk={handlePurchase}
        okText={t("fire.purchase.confirmPurchase")}
        cancelText={t("common.cancel")}
        confirmLoading={loading}
        okButtonProps={{
          disabled: (walletBalance || 0) < (purchaseAmount || 0),
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <p>{t("fire.purchase.rate")}</p>
          <p style={{ color: "#999" }}>
            {t("fire.purchase.minAmount").replace(
              "{min}",
              FIRE_CONFIG.MIN_PURCHASE_AMOUNT.toString()
            )}{" "}
            •{" "}
            {t("fire.purchase.maxAmount").replace(
              "{max}",
              FIRE_CONFIG.MAX_PURCHASE_AMOUNT.toString()
            )}
          </p>
        </div>

        {/* Wallet Balance Display */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "#f6f8fa",
            borderRadius: 8,
            border: "1px solid #e1e4e8",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 500 }}>
              {t("fire.purchase.walletBalance")}:
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color:
                  (walletBalance || 0) >= (purchaseAmount || 0)
                    ? "#52c41a"
                    : "#ff4d4f",
              }}
            >
              {" "}
              {walletLoading
                ? t("common.loading")
                : `$${(walletBalance || 0).toFixed(2)}`}
            </span>
          </div>
          {(walletBalance || 0) < (purchaseAmount || 0) && (
            <div style={{ marginTop: 8, color: "#ff4d4f", fontSize: 12 }}>
              {t("fire.purchase.insufficientBalance")}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>{t("fire.purchase.amount")}:</label>
          <InputNumber
            min={FIRE_CONFIG.MIN_PURCHASE_AMOUNT}
            max={FIRE_CONFIG.MAX_PURCHASE_AMOUNT}
            value={purchaseAmount}
            onChange={(value) => setPurchaseAmount(value || 1)}
            style={{ width: "100%" }}
            size="large"
          />
        </div>

        <div style={{ padding: 12, background: "#f0f2f5", borderRadius: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span>{t("fire.purchase.totalCost")}:</span>
            <strong
              style={{
                fontSize: 18,
                color:
                  (walletBalance || 0) >= (purchaseAmount || 0)
                    ? "#52c41a"
                    : "#ff4d4f",
              }}
            >
              ${(purchaseAmount || 0).toFixed(2)}
            </strong>
          </div>
        </div>
      </Modal>
    </div>
  );
}
