'use client';

/**
 * Purchase Fire Modal Component
 * Modal to purchase Fire with money
 */

import React, { useState } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space, Typography, Divider } from 'antd';
import { FireOutlined, DollarOutlined } from '@ant-design/icons';
import { Currency, PaymentMethod } from '@/lib/utils/enums';
import { fireAPI } from '@/lib/fire/api-client';

const { Text, Title } = Typography;
const { Option } = Select;

interface PurchaseFireModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (newBalance: number) => void;
}

export default function PurchaseFireModal({
  visible,
  onClose,
  onSuccess,
}: PurchaseFireModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fireAmount, setFireAmount] = useState(10);
  const [currency, setCurrency] = useState<Currency>(Currency.USD);

  const priceCalc = fireAPI.calculateFirePrice(fireAmount, currency);

  const handlePurchase = async (values: any) => {
    try {
      setLoading(true);

      const result = await fireAPI.purchaseFire({
        fire_amount: values.fire_amount,
        currency: values.currency,
        payment_method: values.payment_method,
      });

      if (result.success) {
        Modal.success({
          title: 'Purchase Successful!',
          content: result.message,
        });
        onSuccess(result.newBalance);
        onClose();
        form.resetFields();
      }
    } catch (error: any) {
      Modal.error({
        title: 'Purchase Failed',
        content: error.message || 'Failed to purchase Fire. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FireOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
          <span>Purchase Fire Points</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handlePurchase}
        initialValues={{
          fire_amount: 10,
          currency: Currency.USD,
          payment_method: PaymentMethod.WALLET,
        }}
      >
        <Form.Item
          label="Fire Amount"
          name="fire_amount"
          rules={[{ required: true, message: 'Please enter Fire amount' }]}
        >
          <InputNumber
            min={1}
            max={10000}
            prefix={<FireOutlined />}
            style={{ width: '100%' }}
            onChange={(value) => setFireAmount(value || 10)}
          />
        </Form.Item>

        <Form.Item
          label="Currency"
          name="currency"
          rules={[{ required: true, message: 'Please select currency' }]}
        >
          <Select onChange={(value) => setCurrency(value as Currency)}>
            <Option value={Currency.USD}>USD - US Dollar</Option>
            <Option value={Currency.VND}>VND - Vietnamese Dong</Option>
            <Option value={Currency.JPY}>JPY - Japanese Yen</Option>
            <Option value={Currency.KRW}>KRW - Korean Won</Option>
            <Option value={Currency.CNY}>CNY - Chinese Yuan</Option>
          </Select>
        </Form.Item>

        <Divider>Price Calculation</Divider>

        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
          <div
            style={{
              background: '#f5f5f5',
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              <FireOutlined style={{ color: '#ff4d4f' }} /> {priceCalc.fire_amount} Fire Points
            </Title>
            <Divider style={{ margin: '12px 0' }} />
            <Space direction="vertical" size="small">
              <Text>
                <DollarOutlined /> {priceCalc.usd_amount} USD
              </Text>
              <Text type="secondary">≈ {priceCalc.vnd_amount?.toLocaleString()} VND</Text>
              <Text type="secondary">≈ {priceCalc.jpy_amount?.toLocaleString()} JPY</Text>
              <Text type="secondary">≈ {priceCalc.krw_amount?.toLocaleString()} KRW</Text>
              <Text type="secondary">≈ {priceCalc.cny_amount} CNY</Text>
            </Space>
          </div>

          <Text type="secondary" style={{ fontSize: 12 }}>
            Exchange rate: 1 USD = {priceCalc.exchange_rate} Fire
          </Text>
        </Space>

        <Form.Item
          label="Payment Method"
          name="payment_method"
          rules={[{ required: true, message: 'Please select payment method' }]}
        >
          <Select>
            <Option value={PaymentMethod.WALLET}>Wallet Balance</Option>
            <Option value={PaymentMethod.PAYPAL}>PayPal</Option>
            <Option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Purchase Now
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
