'use client';

/**
 * Boost Button Component
 * Button to activate recommendation or profile boost
 */

import React from 'react';
import { Button, Tooltip, Badge } from 'antd';
import { FireOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { BoostType } from '@/lib/utils/enums';

interface BoostButtonProps {
  boostType: BoostType;
  fireCost: number;
  duration: string;
  isActive?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onActivate: () => void;
}

export default function BoostButton({
  boostType,
  fireCost,
  duration,
  isActive = false,
  loading = false,
  disabled = false,
  onActivate,
}: BoostButtonProps) {
  const isRecommendation = boostType === BoostType.RECOMMENDATION;
  const icon = isRecommendation ? <ThunderboltOutlined /> : <UserOutlined />;
  const title = isRecommendation ? 'Top Recommendation' : 'Top Profile';
  const description = isRecommendation
    ? 'Appear first in recommendation list'
    : 'Appear first in profile search';

  const buttonContent = (
    <Button
      type={isActive ? 'primary' : 'default'}
      size="large"
      icon={icon}
      loading={loading}
      disabled={disabled || isActive}
      onClick={onActivate}
      style={{ width: '100%' }}
    >
      {isActive ? (
        <>Active: {title}</>
      ) : (
        <>
          {title} - {fireCost} <FireOutlined style={{ color: '#ff4d4f' }} />
        </>
      )}
    </Button>
  );

  return (
    <Tooltip title={`${description} - Duration: ${duration}`} placement="top">
      {isActive ? <Badge.Ribbon text="Active">{buttonContent}</Badge.Ribbon> : buttonContent}
    </Tooltip>
  );
}
