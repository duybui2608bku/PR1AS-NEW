"use client";

import { useState, useEffect, Suspense } from "react";
import { Button, Form, Input, Typography, ConfigProvider } from "antd";
import {
  LockOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { authAPI } from "@/lib/auth/api-client";
import { getErrorMessage } from "@/lib/utils/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Loading from "@/components/common/Loading";
import styles from "./page.module.css";

const { Title, Text } = Typography;

function ResetPasswordForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL hash (Supabase recovery flow)
    // Supabase sends tokens in URL hash like: #access_token=...&type=recovery
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const type = params.get("type");

        if (accessToken && type === "recovery") {
          setToken(accessToken);
          // Clear hash from URL for security
          window.history.replaceState(null, "", window.location.pathname);
        } else if (accessToken) {
          // If there's an access_token but no type, still try to use it
          setToken(accessToken);
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          setTokenError(true);
        }
      } else {
        // Try to get token from query params as fallback
        const tokenParam = searchParams.get("token");
        if (tokenParam) {
          setToken(tokenParam);
        } else {
          setTokenError(true);
        }
      }
    }
  }, [searchParams]);

  const handleSubmit = async (values: {
    password: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      showMessage.error(
        "Token không hợp lệ. Vui lòng yêu cầu link đặt lại mật khẩu mới."
      );
      return;
    }

    if (values.password !== values.confirmPassword) {
      showMessage.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(values.password, token);
      showMessage.success(
        "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới."
      );
      router.push("/auth/login");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to reset password");
      showMessage.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
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
                {t("auth.resetPassword.invalidToken") || "Link không hợp lệ"}
              </Title>
              <Text type="secondary" className={styles.subtitle}>
                {t("auth.resetPassword.invalidTokenMessage") ||
                  "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới."}
              </Text>
            </div>

            <div className={styles.backLinkContainer}>
              <Link href="/auth/forgot-password" className={styles.backLink}>
                {t("auth.resetPassword.requestNewLink") || "Yêu cầu link mới"}
              </Link>
              <Link href="/auth/login" className={styles.backLink}>
                <ArrowLeftOutlined />{" "}
                {t("auth.forgotPassword.backToLogin") || "Quay lại đăng nhập"}
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
              {t("auth.resetPassword.title") || "Đặt lại mật khẩu"}
            </Title>
            <Text type="secondary" className={styles.subtitle}>
              {t("auth.resetPassword.subtitle") || "Nhập mật khẩu mới của bạn"}
            </Text>
          </div>

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message:
                    t("auth.login.passwordRequired") ||
                    "Vui lòng nhập mật khẩu",
                },
                { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder={
                  t("auth.resetPassword.newPasswordPlaceholder") ||
                  "Mật khẩu mới"
                }
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder={
                  t("auth.resetPassword.confirmPasswordPlaceholder") ||
                  "Xác nhận mật khẩu"
                }
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <div className={styles.passwordRequirements}>
              <Text type="secondary" className={styles.requirementsText}>
                Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường,
                số và ký tự đặc biệt
              </Text>
            </div>

            <Form.Item className={styles.submitFormItem}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className={styles.submitButton}
              >
                {t("auth.resetPassword.resetButton") || "Đặt lại mật khẩu"}
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.backLinkContainer}>
            <Link href="/auth/login" className={styles.backLink}>
              <ArrowLeftOutlined />{" "}
              {t("auth.forgotPassword.backToLogin") || "Quay lại đăng nhập"}
            </Link>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Loading
          variant="fullPage"
          size="large"
          tip="Đang tải trang đặt lại mật khẩu..."
          style={{
            background: "linear-gradient(135deg, #690f0f 0%, #8b1818 100%)",
          }}
        />
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
