'use client';

import { Card, Statistic, Row, Col, Spin, Button } from 'antd';
import { FireOutlined, TrophyOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { getFireBalance } from '@/lib/fire/api-client';
import { GetFireBalanceResponse } from '@/lib/fire/types';

interface FireBalanceProps {
  showDetails?: boolean;
  onPurchaseClick?: () => void;
}

export default function FireBalance({ showDetails = true, onPurchaseClick }: FireBalanceProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GetFireBalanceResponse['data'] | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const response = await getFireBalance();
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load Fire balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <p>{t('common.error')}</p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <FireOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
          {t('fire.title')}
        </span>
      }
      extra={
        onPurchaseClick && (
          <Button type="primary" onClick={onPurchaseClick}>
            {t('fire.purchaseFire')}
          </Button>
        )
      }
    >
      <Row gutter={16}>
        <Col xs={24} sm={showDetails ? 12 : 24} md={showDetails ? 8 : 24}>
          <Statistic
            title={t('fire.balance')}
            value={data.total_fires}
            prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
            valueStyle={{ color: '#ff4d4f', fontSize: showDetails ? 32 : 48 }}
          />
        </Col>

        {showDetails && (
          <>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title={t('fire.earnedFires')}
                value={data.lifetime_fires_earned}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Statistic
                title={t('fire.spentFires')}
                value={data.lifetime_fires_spent}
                prefix={<FallOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
          </>
        )}
      </Row>

      {data.active_boosts.length > 0 && (
        <div style={{ marginTop: 16, padding: 12, background: '#f0f2f5', borderRadius: 8 }}>
          <h4 style={{ margin: '0 0 8px 0' }}>
            <TrophyOutlined /> {t('fire.dashboard.activeBoosts')}
          </h4>
          {data.active_boosts.map((boost, index) => (
            <div key={index} style={{ marginBottom: 4 }}>
              <strong>{boost.boost_type}:</strong> {boost.time_remaining_display} {t('fire.boost.timeRemaining')}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
