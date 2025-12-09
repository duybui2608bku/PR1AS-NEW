"use client";

import { useState } from "react";
import { Button, Form, Input, Typography, ConfigProvider } from "antd";
import { MailOutlined, HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { authAPI } from "@/lib/auth/api-client";
import { getErrorMessage } from "@/lib/utils/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Loading from "@/components/common/Loading";
import styles from "./page.module.css";

const { Title, Text } = Typography;

function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(values.email);
      setEmailSent(true);
      showMessage.success("Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to send reset email");
      showMessage.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#690f0f",
            borderRadius: 8,
          },
        }}
      >
        <div className={styles.container}>
          <div className={styles.languageSwitcher}>
            <Link href="/">
              <Button
                type="text"
                icon={<HomeOutlined />}
                style={{ marginRight: "8px" }}
              >
                {t("common.homeButton")}
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>

          <div className={styles.card}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>PR</div>
              <Title level={2} className={styles.title}>
                {t("auth.forgotPassword.checkEmail") || "Kiểm tra email"}
              </Title>
              <Text type="secondary" className={styles.subtitle}>
                {t("auth.forgotPassword.emailSentMessage") ||
                  "Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn."}
              </Text>
            </div>

            <div className={styles.successMessage}>
              <Text type="secondary" className={styles.successText}>
                {t("auth.forgotPassword.checkSpam") ||
                  "Nếu không thấy email, vui lòng kiểm tra thư mục spam hoặc thư rác."}
              </Text>
            </div>

            <div className={styles.backLinkContainer}>
              <Link href="/auth/login" className={styles.backLink}>
                <ArrowLeftOutlined /> {t("auth.forgotPassword.backToLogin") || "Quay lại đăng nhập"}
              </Link>
            </div>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#690f0f",
          borderRadius: 8,
        },
      }}
    >
      <div className={styles.container}>
        <div className={styles.languageSwitcher}>
          <Link href="/">
            <Button
              type="text"
              icon={<HomeOutlined />}
              style={{ marginRight: "8px" }}
            >
              {t("common.homeButton")}
            </Button>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className={styles.card}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>PR</div>
            <Title level={2} className={styles.title}>
              {t("auth.forgotPassword.title") || "Quên mật khẩu"}
            </Title>
            <Text type="secondary" className={styles.subtitle}>
              {t("auth.forgotPassword.subtitle") ||
                "Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu"}
            </Text>
          </div>

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("auth.login.emailRequired") || "Vui lòng nhập email" },
                { type: "email", message: t("auth.login.emailInvalid") || "Email không hợp lệ" },
              ]}
            >
              <Input
                prefix={<MailOutlined className={styles.inputIcon} />}
                placeholder={t("auth.login.emailPlaceholder") || "Nhập email của bạn"}
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item className={styles.submitFormItem}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className={styles.submitButton}
              >
                {t("auth.forgotPassword.sendResetLink") || "Gửi link đặt lại mật khẩu"}
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.backLinkContainer}>
            <Link href="/auth/login" className={styles.backLink}>
              <ArrowLeftOutlined /> {t("auth.forgotPassword.backToLogin") || "Quay lại đăng nhập"}
            </Link>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Loading
      variant="fullPage"
      size="large"
      tip="Đang tải..."
      style={{
        background: "linear-gradient(135deg, #690f0f 0%, #8b1818 100%)",
      }}
    >
      <ForgotPasswordForm />
    </Loading>
  );
}

