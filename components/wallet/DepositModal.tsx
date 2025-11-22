/**
 * Deposit Modal Component
 * Allows users to deposit money via Bank Transfer or PayPal
 * Usage: <DepositModal open={open} onClose={onClose} />
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Modal,
  Tabs,
  Form,
  InputNumber,
  Button,
  message,
  Space,
  Alert,
} from "antd";
import { BankOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { walletAPI, walletHelpers } from "@/lib/wallet/api-client";
import type { BankDeposit } from "@/lib/wallet/types";
import { getErrorMessage } from "@/lib/utils/common";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DepositModal({
  open,
  onClose,
  onSuccess,
}: DepositModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [bankDeposit, setBankDeposit] = useState<BankDeposit | null>(null);
  const [form] = Form.useForm();

  const handleBankDeposit = async (values: { amount_usd: number }) => {
    try {
      setLoading(true);
      const amountVND = values.amount_usd * 24000;
      const result = await walletAPI.depositBankTransfer(
        values.amount_usd,
        amountVND
      );

      setBankDeposit(result.deposit);
      message.success(t("wallet.deposit.qrSuccess"));
    } catch (error) {
      const errorMessage = getErrorMessage(error, t("wallet.deposit.failed"));
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalDeposit = async (values: { amount_usd: number }) => {
    try {
      setLoading(true);
      const result = await walletAPI.depositPayPal(values.amount_usd);

      window.location.href = result.approval_url;
    } catch (error) {
      const errorMessage = getErrorMessage(error, t("wallet.deposit.failed"));
      message.error(errorMessage);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setBankDeposit(null);
    form.resetFields();
    onClose();
  };

  const handleSuccess = () => {
    setBankDeposit(null);
    form.resetFields();
    onSuccess?.();
    onClose();
  };

  return (
    <Modal
      title={t("wallet.deposit.title")}
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      {!bankDeposit ? (
        <Tabs
          items={[
            {
              key: "bank",
              label: (
                <span>
                  <BankOutlined /> {t("wallet.deposit.bankTransfer")}
                </span>
              ),
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleBankDeposit}
                >
                  <Form.Item
                    label={t("wallet.deposit.amount")}
                    name="amount_usd"
                    rules={[
                      {
                        required: true,
                        message: t("wallet.deposit.amountRequired"),
                      },
                      {
                        type: "number",
                        min: 10,
                        message: t("wallet.deposit.minimumDeposit"),
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      prefix="$"
                      placeholder={t("wallet.deposit.amountPlaceholder")}
                      min={10}
                      step={10}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Alert
                      message={t("wallet.deposit.bankInfo")}
                      description={t("wallet.deposit.bankInfoDesc")}
                      type="info"
                      showIcon
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      {t("wallet.deposit.generateQR")}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "paypal",
              label: (
                <span>
                  <CreditCardOutlined /> {t("wallet.deposit.paypal")}
                </span>
              ),
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handlePayPalDeposit}
                >
                  <Form.Item
                    label={t("wallet.deposit.amount")}
                    name="amount_usd"
                    rules={[
                      {
                        required: true,
                        message: t("wallet.deposit.amountRequired"),
                      },
                      {
                        type: "number",
                        min: 10,
                        message: t("wallet.deposit.minimumDeposit"),
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      prefix="$"
                      placeholder={t("wallet.deposit.amountPlaceholder")}
                      min={10}
                      step={10}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Alert
                      message={t("wallet.deposit.paypalInfo")}
                      description={t("wallet.deposit.paypalInfoDesc")}
                      type="info"
                      showIcon
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      {t("wallet.deposit.payWithPayPal")}
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Alert message={t("wallet.deposit.scanQR")} type="success" showIcon />

          <div
            style={{
              textAlign: "center",
              position: "relative",
              width: "100%",
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            <Image
              src={bankDeposit.qr_code_url}
              alt="QR Code for Bank Transfer"
              width={400}
              height={400}
              style={{
                width: "100px",
                height: "auto",
              }}
              unoptimized
            />
          </div>

          <div
            style={{
              padding: "16px",
              background: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <p>
              <strong>{t("wallet.deposit.bank")}:</strong>{" "}
              {bankDeposit.bank_name}
            </p>
            <p>
              <strong>{t("wallet.deposit.account")}:</strong>{" "}
              {bankDeposit.bank_account}
            </p>
            <p>
              <strong>{t("wallet.deposit.amount")}:</strong>{" "}
              {walletHelpers.formatVND(bankDeposit.amount_vnd || 0)}
            </p>
            <p>
              <strong>{t("wallet.deposit.transferContent")}:</strong>{" "}
              <code
                style={{
                  background: "#fff",
                  padding: "4px 8px",
                  borderRadius: "4px",
                }}
              >
                {bankDeposit.transfer_content}
              </code>
            </p>
            <p
              style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "12px" }}
            >
              {t("wallet.deposit.importantNote")}
            </p>
          </div>

          <Alert
            message={t("wallet.deposit.autoConfirm")}
            description={t("wallet.deposit.autoConfirmDesc")}
            type="info"
          />

          <Space style={{ width: "100%", justifyContent: "center" }}>
            <Button onClick={handleClose}>{t("wallet.deposit.close")}</Button>
            <Button type="primary" onClick={handleSuccess}>
              {t("wallet.deposit.completed")}
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
}
