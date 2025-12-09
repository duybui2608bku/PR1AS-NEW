"use client";

import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Typography,
  Divider,
  Radio,
  Space,
  ConfigProvider,
  Row,
  Col,
} from "antd";
import {
  GoogleOutlined,
  MailOutlined,
  LockOutlined,
  UserOutlined,
  CheckCircleFilled,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  StarFilled,
  HomeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { authAPI, redirectByRole } from "@/lib/auth/api-client";
import { getErrorMessage } from "@/lib/utils/common";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import styles from "./page.module.css";

const { Title, Text } = Typography;

type UserRole = "client" | "worker";

export default function SignupPage() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [selectedRole, setSelectedRole] = useState<UserRole>("client");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignup = () => {
    showMessage.info(t("auth.signup.googleSignupComingSoon"));
  };

  const handleEmailSignup = async (values: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    setLoading(true);
    try {
      const result = await authAPI.signUp(values.email, values.password, values.role, values.name);
      
      // Hỗ trợ cả 2 dạng response:
      // 1) { success, user, session }
      // 2) { success, data: { user, session } }
      const user = (result as any).user ?? (result as any).data?.user;

      if (!user || !user.role) {
        showMessage.error("Dữ liệu đăng ký không hợp lệ. Vui lòng thử lại.");
        return;
      }

      showMessage.success(t("auth.signup.signupSuccess"));
      
      // Redirect based on user role
      const redirectUrl = redirectByRole(user.role);
      router.push(redirectUrl);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Sign up failed");
      
      if (errorMessage.includes("EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE")) {
        showMessage.error("Email này đã được đăng ký với vai trò khác. Vui lòng đăng nhập hoặc sử dụng email khác.");
      } else if (errorMessage.includes("ACCOUNT_BANNED")) {
        showMessage.error("Tài khoản của bạn đã bị khóa");
        router.push("/banned");
      } else if (errorMessage.includes("Email already registered")) {
        showMessage.error("Email này đã được đăng ký. Vui lòng đăng nhập.");
        router.push("/auth/login");
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
          <Row className={styles.row}>
            {/* Left Column - Info Section */}
            <Col xs={0} md={10} className={styles.leftColumn}>
              {/* Logo */}
              <div className={styles.logo}>PR</div>

              <Title level={1} className={styles.title}>
                {t("auth.signup.title")}
              </Title>
              <Text className={styles.subtitle}>
                {t("auth.signup.subtitle")}
              </Text>

              {/* Features List */}
              <div className={styles.featuresList}>
                <div className={styles.featureItem}>
                  <CheckCircleFilled className={styles.featureIcon} />
                  <div>
                    <Text strong className={styles.featureTitle}>
                      Verified Workers
                    </Text>
                    <Text className={styles.featureDescription}>
                      All workers are identity-verified
                    </Text>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <SafetyCertificateOutlined className={styles.featureIcon} />
                  <div>
                    <Text strong className={styles.featureTitle}>
                      Secure Payment
                    </Text>
                    <Text className={styles.featureDescription}>
                      Safe and encrypted payment
                    </Text>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <ThunderboltOutlined className={styles.featureIcon} />
                  <div>
                    <Text strong className={styles.featureTitle}>
                      Fast Booking
                    </Text>
                    <Text className={styles.featureDescription}>
                      Book services in seconds
                    </Text>
                  </div>
                </div>

                <div className={styles.featureItem}>
                  <StarFilled className={styles.featureIcon} />
                  <div>
                    <Text strong className={styles.featureTitle}>
                      Quality Guaranteed
                    </Text>
                    <Text className={styles.featureDescription}>
                      Read reviews from customers
                    </Text>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className={styles.stats}>
                <Row gutter={24}>
                  <Col span={8} className={styles.statItem}>
                    <Text strong className={styles.statNumber}>
                      25K+
                    </Text>
                    <Text className={styles.statLabel}>Workers</Text>
                  </Col>
                  <Col span={8} className={styles.statItem}>
                    <Text strong className={styles.statNumber}>
                      100K+
                    </Text>
                    <Text className={styles.statLabel}>Jobs Done</Text>
                  </Col>
                  <Col span={8} className={styles.statItem}>
                    <Text strong className={styles.statNumber}>
                      4.9★
                    </Text>
                    <Text className={styles.statLabel}>Rating</Text>
                  </Col>
                </Row>
              </div>
            </Col>

            {/* Right Column - Form Section */}
            <Col xs={24} md={14} className={styles.rightColumn}>
              {/* Mobile Logo */}
              <div className={styles.mobileLogoContainer}>
                <div className={styles.mobileLogo}>PR</div>
                <Title level={2} className={styles.mobileTitle}>
                  {t("auth.signup.title")}
                </Title>
                <Text
                  type="secondary"
                  className={`${styles.mobileSubtitle} md:hidden`}
                >
                  {t("auth.signup.subtitle")}
                </Text>
              </div>

              {/* Role Selection */}
              <div className={styles.roleSelection}>
                <Text strong className={styles.roleLabel}>
                  {t("auth.signup.selectRole")}
                </Text>
                <Radio.Group
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    form.setFieldsValue({ role: e.target.value });
                  }}
                  className={styles.radioGroup}
                >
                  <Space direction="vertical" className={styles.radioSpace}>
                    <Radio
                      style={{
                        padding: 10,
                      }}
                      value="client"
                      className={`${styles.radioOption} ${
                        selectedRole === "client"
                          ? styles.radioOptionClient
                          : styles.radioOptionClientInactive
                      }`}
                    >
                      <div>
                        <Text
                          strong
                          className={`${styles.roleTitle} ${
                            selectedRole === "client"
                              ? styles.roleTitleActive
                              : styles.roleTitleInactive
                          }`}
                        >
                          {t("auth.signup.clientRole")}
                        </Text>
                        <br />
                        <Text
                          type="secondary"
                          className={styles.roleDescription}
                        >
                          {t("auth.signup.clientDescription")}
                        </Text>
                      </div>
                    </Radio>
                    <Radio
                      value="worker"
                      style={{
                        padding: 10,
                      }}
                      className={`${styles.radioOption} ${
                        selectedRole === "worker"
                          ? styles.radioOptionWorker
                          : styles.radioOptionWorkerInactive
                      }`}
                    >
                      <div>
                        <Text
                          strong
                          className={`${styles.roleTitle} ${
                            selectedRole === "worker"
                              ? styles.roleTitleActive
                              : styles.roleTitleInactive
                          }`}
                        >
                          {t("auth.signup.workerRole")}
                        </Text>
                        <br />
                        <Text
                          type="secondary"
                          className={styles.roleDescription}
                        >
                          {t("auth.signup.workerDescription")}
                        </Text>
                      </div>
                    </Radio>
                  </Space>
                </Radio.Group>
              </div>

              {/* Google Signup Button */}
              <Button
                type="default"
                size="large"
                icon={<GoogleOutlined />}
                block
                onClick={handleGoogleSignup}
                className={styles.googleButton}
              >
                {t("auth.signup.continueWithGoogle")}
              </Button>

              <Divider className={styles.divider}>
                <Text type="secondary" className={styles.dividerText}>
                  {t("auth.signup.orSignupWithEmail")}
                </Text>
              </Divider>

              {/* Signup Form */}
              <Form
                form={form}
                onFinish={handleEmailSignup}
                layout="vertical"
                initialValues={{ role: selectedRole }}
              >
                <Form.Item name="role" hidden>
                  <Input />
                </Form.Item>

                <Form.Item
                  name="name"
                  rules={[
                    { required: true, message: t("auth.signup.nameRequired") },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className={styles.inputIcon} />}
                    placeholder={t("auth.signup.namePlaceholder")}
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: t("auth.signup.emailRequired") },
                    { type: "email", message: t("auth.signup.emailInvalid") },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined className={styles.inputIcon} />}
                    placeholder={t("auth.signup.emailPlaceholder")}
                    size="large"
                    className={styles.input}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: t("auth.signup.passwordRequired"),
                    },
                    { 
                      min: 8, 
                      message: "Mật khẩu phải có ít nhất 8 ký tự" 
                    },
                    {
                      pattern: /[A-Z]/,
                      message: "Mật khẩu phải có ít nhất một chữ hoa",
                    },
                    {
                      pattern: /[a-z]/,
                      message: "Mật khẩu phải có ít nhất một chữ thường",
                    },
                    {
                      pattern: /[0-9]/,
                      message: "Mật khẩu phải có ít nhất một số",
                    },
                    {
                      pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                      message: "Mật khẩu phải có ít nhất một ký tự đặc biệt",
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className={styles.inputIcon} />}
                    placeholder={t("auth.signup.passwordPlaceholder")}
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
                    {t("auth.signup.signupButton")}
                  </Button>
                </Form.Item>
              </Form>

              {/* Login Link */}
              <div className={styles.loginLinkContainer}>
                <Text type="secondary" className={styles.loginText}>
                  {t("auth.signup.haveAccount")}{" "}
                  <Link href="/auth/login" className={styles.loginLink}>
                    {t("auth.signup.loginLink")}
                  </Link>
                </Text>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </ConfigProvider>
  );
}
