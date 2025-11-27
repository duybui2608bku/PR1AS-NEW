'use client';

/**
 * Boost Timer Component
 * Countdown timer for active boosts
 */

import React, { useState, useEffect } from 'react';
import { Card, Progress, Typography, Space } from 'antd';
import { ClockCircleOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { BoostType } from '@/lib/utils/enums';
import { ActiveBoostInfo } from '@/lib/fire/types';

const { Text, Title } = Typography;

interface BoostTimerProps {
  boost: ActiveBoostInfo;
  onExpire?: () => void;
}

export default function BoostTimer({ boost, onExpire }: BoostTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(boost.remaining_seconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onExpire]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isRecommendation = boost.boost_type === BoostType.RECOMMENDATION;
  const totalDuration = isRecommendation ? 12 * 3600 : 2 * 3600; // 12 or 2 hours in seconds
  const progressPercent = (remainingSeconds / totalDuration) * 100;

  const icon = isRecommendation ? (
    <ThunderboltOutlined style={{ fontSize: 24 }} />
  ) : (
    <UserOutlined style={{ fontSize: 24 }} />
  );

  const title = isRecommendation ? 'Top Recommendation' : 'Top Profile';
  const color = remainingSeconds < 600 ? '#ff4d4f' : '#52c41a'; // Red if < 10 minutes

  return (
    <Card size="small">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          {icon}
          <Text strong>{title} Active</Text>
        </Space>

        <Title level={3} style={{ margin: 0, color }}>
          <ClockCircleOutlined /> {formatTime(remainingSeconds)}
        </Title>

        <Progress
          percent={progressPercent}
          showInfo={false}
          strokeColor={color}
          trailColor="#f0f0f0"
        />

        <Text type="secondary" style={{ fontSize: 12 }}>
          Expires at {new Date(boost.expires_at).toLocaleTimeString()}
        </Text>
      </Space>
    </Card>
  );
}
