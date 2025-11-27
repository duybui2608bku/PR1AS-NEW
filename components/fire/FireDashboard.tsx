'use client';

/**
 * Fire Dashboard Component
 * Main dashboard for Fire Points system in Worker profile
 */

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Space, Button, Modal, message } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import { fireAPI } from '@/lib/fire/api-client';
import { BoostType } from '@/lib/utils/enums';
import { FireBalanceResponse, ActiveBoostInfo } from '@/lib/fire/types';

import FireBalance from './FireBalance';
import BoostButton from './BoostButton';
import BoostTimer from './BoostTimer';
import DailyLoginButton from './DailyLoginButton';
import PurchaseFireModal from './PurchaseFireModal';

export default function FireDashboard() {
  const [loading, setLoading] = useState(true);
  const [balanceData, setBalanceData] = useState<FireBalanceResponse | null>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [activatingBoost, setActivatingBoost] = useState<BoostType | null>(null);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);

  // Load Fire balance data
  const loadBalance = async () => {
    try {
      setLoading(true);
      const data = await fireAPI.getBalance();
      setBalanceData(data);
    } catch (error: any) {
      message.error(error.message || 'Failed to load Fire balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  // Handle daily login claim
  const handleClaimDaily = async () => {
    try {
      setClaimingDaily(true);
      const result = await fireAPI.claimDailyLogin();
      message.success(result.message);
      await loadBalance(); // Reload balance
    } catch (error: any) {
      message.error(error.message || 'Failed to claim daily reward');
    } finally {
      setClaimingDaily(false);
    }
  };

  // Handle boost activation
  const handleActivateBoost = async (boostType: BoostType) => {
    // Confirm with user
    const isRecommendation = boostType === BoostType.RECOMMENDATION;
    const duration = isRecommendation ? '12 hours' : '2 hours';
    const title = isRecommendation ? 'Top Recommendation' : 'Top Profile';

    Modal.confirm({
      title: `Activate ${title} Boost?`,
      content: `This will cost 1 Fire and boost your profile for ${duration}. Continue?`,
      okText: 'Yes, Activate',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setActivatingBoost(boostType);
          const result = await fireAPI.activateBoost({ boost_type: boostType });
          message.success(result.message);
          await loadBalance(); // Reload balance
        } catch (error: any) {
          message.error(error.message || 'Failed to activate boost');
        } finally {
          setActivatingBoost(null);
        }
      },
    });
  };

  // Handle purchase success
  const handlePurchaseSuccess = (newBalance: number) => {
    message.success('Fire purchased successfully!');
    loadBalance(); // Reload balance
  };

  if (loading) {
    return <Card loading />;
  }

  if (!balanceData) {
    return <Card>Failed to load Fire data</Card>;
  }

  const { balance, activeBoosts, canClaimDailyLogin } = balanceData;

  const recommendationBoost = activeBoosts.find(
    (b) => b.boost_type === BoostType.RECOMMENDATION
  );
  const profileBoost = activeBoosts.find((b) => b.boost_type === BoostType.PROFILE);

  return (
    <div className="fire-dashboard">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header with Balance and Purchase button */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={16}>
            <FireBalance
              balance={balance.fire_balance}
              totalEarned={balance.total_earned}
              totalSpent={balance.total_spent}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Button
              type="primary"
              size="large"
              icon={<ShoppingOutlined />}
              onClick={() => setPurchaseModalVisible(true)}
              style={{ width: '100%', height: '100%', minHeight: 80 }}
            >
              Purchase Fire
            </Button>
          </Col>
        </Row>

        {/* Daily Login Reward */}
        <Card title="Daily Reward" size="small">
          <DailyLoginButton
            canClaim={canClaimDailyLogin}
            loading={claimingDaily}
            onClaim={handleClaimDaily}
          />
        </Card>

        {/* Active Boosts Timers */}
        {activeBoosts.length > 0 && (
          <Card title="Active Boosts" size="small">
            <Row gutter={[16, 16]}>
              {activeBoosts.map((boost) => (
                <Col key={boost.boost_id} xs={24} sm={12}>
                  <BoostTimer boost={boost} onExpire={loadBalance} />
                </Col>
              ))}
            </Row>
          </Card>
        )}

        {/* Boost Activation Buttons */}
        <Card title="Activate Boosts" size="small">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <BoostButton
              boostType={BoostType.RECOMMENDATION}
              fireCost={1}
              duration="12 hours"
              isActive={!!recommendationBoost}
              loading={activatingBoost === BoostType.RECOMMENDATION}
              disabled={balance.fire_balance < 1}
              onActivate={() => handleActivateBoost(BoostType.RECOMMENDATION)}
            />

            <BoostButton
              boostType={BoostType.PROFILE}
              fireCost={1}
              duration="2 hours"
              isActive={!!profileBoost}
              loading={activatingBoost === BoostType.PROFILE}
              disabled={balance.fire_balance < 1}
              onActivate={() => handleActivateBoost(BoostType.PROFILE)}
            />
          </Space>
        </Card>
      </Space>

      {/* Purchase Modal */}
      <PurchaseFireModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
        onSuccess={handlePurchaseSuccess}
      />
    </div>
  );
}
