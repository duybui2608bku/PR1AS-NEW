'use client';

/**
 * Fire Balance Component
 * Displays worker's current Fire points balance
 */

import React from 'react';
import { Card, Statistic, Space, Typography } from 'antd';
import { FireOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface FireBalanceProps {
  balance: number;
  totalEarned?: number;
  totalSpent?: number;
  loading?: boolean;
}

export default function FireBalance({
  balance,
  totalEarned,
  totalSpent,
  loading = false,
}: FireBalanceProps) {
  return (
    <Card loading={loading} className="fire-balance-card">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Statistic
          title="Fire Points"
          value={balance}
          prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
          valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
        />

        {(totalEarned !== undefined || totalSpent !== undefined) && (
          <Space direction="horizontal" size="large">
            {totalEarned !== undefined && (
              <div>
                <Text type="secondary">Total Earned</Text>
                <div>
                  <Text strong style={{ color: '#52c41a' }}>
                    +{totalEarned}
                  </Text>
                </div>
              </div>
            )}
            {totalSpent !== undefined && (
              <div>
                <Text type="secondary">Total Spent</Text>
                <div>
                  <Text strong style={{ color: '#ff4d4f' }}>
                    -{totalSpent}
                  </Text>
                </div>
              </div>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
}
