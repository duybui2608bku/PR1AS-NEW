"use client";

import { useState, Suspense } from "react";
import { Button, Form, Input, Typography, Divider, ConfigProvider, Spin } from "antd";
import {
  GoogleOutlined,
  MailOutlined,
  LockOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { authAPI, redirectByRole } from "@/lib/auth/api-client";
import { getErrorMessage } from "@/lib/utils/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import Loading from "@/components/common/Loading";
import styles from "./page.module.css";

const { Title, Text } = Typography;

function LoginForm() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGoogleLogin = () => {
    showMessage.info(t("auth.login.googleLoginComingSoon"));
  };

  const handleEmailLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await authAPI.login(values.email, values.password);
      
      showMessage.success(t("auth.login.loginSuccess"));
      
      // Check if there's a redirect parameter in the URL
      const redirectParam = searchParams.get("redirect");
      const redirectUrl = redirectParam || redirectByRole(result.user.role);
      
      router.push(redirectUrl);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Login failed");
      
      if (errorMessage.includes("ACCOUNT_BANNED")) {
        showMessage.error("Tài khoản của bạn đã bị khóa");
        router.push("/banned");
      } else if (errorMessage.includes("NO_PROFILE")) {
        showMessage.error("Tài khoản không tồn tại. Vui lòng đăng ký.");
        router.push("/auth/signup");
      } else if (errorMessage.includes("Invalid email or password")) {
        showMessage.error("Email hoặc mật khẩu không đúng");
      } else {
        showMessage.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
        {/* Language Switcher and Back to Home */}
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
          {/* Logo/Brand */}
          <div className={styles.logoContainer}>
            <div className={styles.logo}>PR</div>
            <Title level={2} className={styles.title}>
              {t("auth.login.title")}
            </Title>
            <Text type="secondary" className={styles.subtitle}>
              {t("auth.login.subtitle")}
            </Text>
          </div>

          {/* Google Login Button */}
          <Button
            type="default"
            size="large"
            icon={<GoogleOutlined />}
            block
            onClick={handleGoogleLogin}
            className={styles.googleButton}
          >
            {t("auth.login.continueWithGoogle")}
          </Button>

          <Divider className={styles.divider}>
            <Text type="secondary" className={styles.dividerText}>
              {t("auth.login.orLoginWithEmail")}
            </Text>
          </Divider>

          {/* Login Form */}
          <Form form={form} onFinish={handleEmailLogin} layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t("auth.login.emailRequired") },
                { type: "email", message: t("auth.login.emailInvalid") },
              ]}
            >
              <Input
                prefix={<MailOutlined className={styles.inputIcon} />}
                placeholder={t("auth.login.emailPlaceholder")}
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t("auth.login.passwordRequired") },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className={styles.inputIcon} />}
                placeholder={t("auth.login.passwordPlaceholder")}
                size="large"
                className={styles.input}
              />
            </Form.Item>

            <div className={styles.rememberForgot}>
              <div></div>
              <Link href="/auth/forgot-password" className={styles.forgotLink}>
                {t("auth.login.forgotPassword")}
              </Link>
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
                {t("auth.login.loginButton")}
              </Button>
            </Form.Item>
          </Form>

          {/* Sign Up Link */}
          <div className={styles.signupLinkContainer}>
            <Text type="secondary" className={styles.signupText}>
              {t("auth.login.noAccount")}{" "}
              <Link href="/auth/signup" className={styles.signupLink}>
                {t("auth.login.signupLink")}
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Loading
          variant="fullPage"
          size="large"
          tip="Đang tải trang đăng nhập..."
          style={{
            background: "linear-gradient(135deg, #690f0f 0%, #8b1818 100%)",
          }}
        />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
