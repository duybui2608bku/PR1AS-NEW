/**
 * Withdraw Modal Component
 * Allows users to withdraw money to Bank Account or PayPal
 * Usage: <WithdrawModal open={open} onClose={onClose} />
 */

"use client";

import { useState } from "react";
import {
  Modal,
  Tabs,
  Form,
  InputNumber,
  Input,
  Button,
  message,
  Alert,
  Space,
} from "antd";
import { BankOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { walletAPI } from "@/lib/wallet/api-client";

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WithdrawModal({
  open,
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleBankWithdraw = async (values: {
    amount_usd: number;
    bank_account: string;
    bank_name: string;
    account_holder: string;
  }) => {
    try {
      setLoading(true);
      await walletAPI.withdrawBank(
        values.amount_usd,
        values.bank_account,
        values.bank_name,
        values.account_holder
      );

      message.success(t('wallet.withdraw.success'));
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      message.error((error as Error).message ?? t('wallet.withdraw.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalWithdraw = async (values: {
    amount_usd: number;
    paypal_email: string;
  }) => {
    try {
      setLoading(true);
      await walletAPI.withdrawPayPal(values.amount_usd, values.paypal_email);

      message.success(t('wallet.withdraw.success'));
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      message.error((error as Error).message ?? t('wallet.withdraw.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('wallet.withdraw.title')}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      <Tabs
        items={[
          {
            key: "bank",
            label: (
              <span>
                <BankOutlined /> {t('wallet.withdraw.bankTransfer')}
              </span>
            ),
            children: (
              <Form form={form} layout="vertical" onFinish={handleBankWithdraw}>
                <Form.Item
                  label={t('wallet.withdraw.amount')}
                  name="amount_usd"
                  rules={[
                    { required: true, message: t('wallet.withdraw.amountRequired') },
                    {
                      type: "number",
                      min: 50,
                      message: t('wallet.withdraw.minimumWithdraw'),
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    prefix="$"
                    placeholder={t('wallet.withdraw.amountPlaceholder')}
                    min={50}
                    step={10}
                  />
                </Form.Item>

                <Form.Item
                  label={t('wallet.withdraw.bankName')}
                  name="bank_name"
                  rules={[
                    { required: true, message: t('wallet.withdraw.bankNameRequired') },
                  ]}
                >
                  <Input placeholder={t('wallet.withdraw.bankNamePlaceholder')} />
                </Form.Item>

                <Form.Item
                  label={t('wallet.withdraw.accountNumber')}
                  name="bank_account"
                  rules={[
                    { required: true, message: t('wallet.withdraw.accountNumberRequired') },
                    {
                      pattern: /^[0-9]+$/,
                      message: t('wallet.withdraw.accountNumberInvalid'),
                    },
                  ]}
                >
                  <Input placeholder={t('wallet.withdraw.accountNumberPlaceholder')} />
                </Form.Item>

                <Form.Item
                  label={t('wallet.withdraw.accountHolder')}
                  name="account_holder"
                  rules={[
                    {
                      required: true,
                      message: t('wallet.withdraw.accountHolderRequired'),
                    },
                  ]}
                >
                  <Input placeholder={t('wallet.withdraw.accountHolderPlaceholder')} />
                </Form.Item>

                <Form.Item>
                  <Alert
                    message={t('wallet.withdraw.bankInfo')}
                    description={t('wallet.withdraw.bankInfoDesc')}
                    type="info"
                    showIcon
                  />
                </Form.Item>

                <Form.Item>
                  <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                    <Button onClick={handleClose}>{t('wallet.withdraw.cancel')}</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      size="large"
                    >
                      {t('wallet.withdraw.submit')}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ),
          },
          {
            key: "paypal",
            label: (
              <span>
                <CreditCardOutlined /> {t('wallet.withdraw.paypal')}
              </span>
            ),
            children: (
              <Form
                form={form}
                layout="vertical"
                onFinish={handlePayPalWithdraw}
              >
                <Form.Item
                  label={t('wallet.withdraw.amount')}
                  name="amount_usd"
                  rules={[
                    { required: true, message: t('wallet.withdraw.amountRequired') },
                    {
                      type: "number",
                      min: 50,
                      message: t('wallet.withdraw.minimumWithdraw'),
                    },
                  ]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    prefix="$"
                    placeholder={t('wallet.withdraw.amountPlaceholder')}
                    min={50}
                    step={10}
                  />
                </Form.Item>

                <Form.Item
                  label={t('wallet.withdraw.paypalEmail')}
                  name="paypal_email"
                  rules={[
                    { required: true, message: t('wallet.withdraw.paypalEmailRequired') },
                    { type: "email", message: t('wallet.withdraw.paypalEmailInvalid') },
                  ]}
                >
                  <Input placeholder={t('wallet.withdraw.paypalEmailPlaceholder')} />
                </Form.Item>

                <Form.Item>
                  <Alert
                    message={t('wallet.withdraw.paypalInfo')}
                    description={t('wallet.withdraw.paypalInfoDesc')}
                    type="info"
                    showIcon
                  />
                </Form.Item>

                <Form.Item>
                  <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                    <Button onClick={handleClose}>{t('wallet.withdraw.cancel')}</Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      size="large"
                    >
                      {t('wallet.withdraw.submit')}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  );
}
