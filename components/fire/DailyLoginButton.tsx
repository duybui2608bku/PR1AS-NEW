'use client';

/**
 * Daily Login Button Component
 * Button to claim daily login reward
 */

import React from 'react';
import { Button, Tooltip } from 'antd';
import { GiftOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface DailyLoginButtonProps {
  canClaim: boolean;
  loading?: boolean;
  onClaim: () => void;
}

export default function DailyLoginButton({
  canClaim,
  loading = false,
  onClaim,
}: DailyLoginButtonProps) {
  return (
    <Tooltip
      title={
        canClaim
          ? 'Claim your daily Fire reward!'
          : 'You have already claimed today. Come back tomorrow!'
      }
      placement="top"
    >
      <Button
        type={canClaim ? 'primary' : 'default'}
        size="large"
        icon={canClaim ? <GiftOutlined /> : <CheckCircleOutlined />}
        loading={loading}
        disabled={!canClaim}
        onClick={onClaim}
        style={{ width: '100%' }}
      >
        {canClaim ? 'Claim Daily Fire (+1)' : 'Already Claimed Today'}
      </Button>
    </Tooltip>
  );
}
