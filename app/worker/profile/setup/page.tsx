"use client";

import { useState, useEffect } from "react";
import { Card, Steps, Button, Typography, Space, Spin, Result } from "antd";
import {
  UserOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { getErrorMessage } from "@/lib/utils/common";
import { workerProfileAPI } from "@/lib/worker/api-client";
import { WorkerProfileComplete } from "@/lib/worker/types";
import { WorkerProfileStatus } from "@/lib/utils/enums";
import Step1BasicInfo from "@/components/worker/Step1BasicInfo";
import Step2ServicesAndPricing from "@/components/worker/Step2ServicesAndPricing";

const { Title, Paragraph } = Typography;

export default function WorkerProfileSetupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<WorkerProfileComplete | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await workerProfileAPI.getProfile();
      setProfile(profileData);

      // Determine current step based on profile_completed_steps
      if (profileData.profile_completed_steps === 0) {
        setCurrentStep(0);
      } else if (
        profileData.profile_completed_steps >= 1 &&
        profileData.profile_completed_steps < 3
      ) {
        setCurrentStep(1);
      } else if (profileData.profile_completed_steps === 3) {
        // Both steps completed
        if (profileData.profile_status === WorkerProfileStatus.DRAFT) {
          setCurrentStep(2); // Show submit page
        }
      }
    } catch (error) {
      // Profile doesn't exist yet, start from step 0
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Complete = async () => {
    await loadProfile();
    setCurrentStep(1);
  };

  const handleStep2Complete = async () => {
    await loadProfile();
    setCurrentStep(2);
  };

  const handleSubmitForReview = async () => {
    try {
      setSubmitting(true);
      await workerProfileAPI.submitForReview();
      showMessage.success(t("worker.profile.submitSuccess"));
      router.push("/worker/dashboard");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showMessage.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  // If profile is already submitted or published
  if (
    profile &&
    [
      WorkerProfileStatus.PENDING,
      WorkerProfileStatus.APPROVED,
      WorkerProfileStatus.PUBLISHED,
    ].includes(profile.profile_status)
  ) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
        <Card>
          <Result
            status={
              profile.profile_status === WorkerProfileStatus.PUBLISHED
                ? "success"
                : "info"
            }
            title={
              profile.profile_status === WorkerProfileStatus.PUBLISHED
                ? t("worker.profile.published")
                : profile.profile_status === WorkerProfileStatus.PENDING
                ? t("worker.profile.underReview")
                : t("worker.profile.approved")
            }
            subTitle={
              profile.profile_status === WorkerProfileStatus.PUBLISHED
                ? t("worker.profile.publishedDesc")
                : profile.profile_status === WorkerProfileStatus.PENDING
                ? t("worker.profile.underReviewDesc")
                : t("worker.profile.approvedDesc")
            }
            extra={[
              <Button
                key="dashboard"
                type="primary"
                onClick={() => router.push("/worker/dashboard")}
              >
                {t("common.backToDashboard")}
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  // If profile is rejected
  if (profile && profile.profile_status === WorkerProfileStatus.REJECTED) {
    return (
      <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
        <Card>
          <Result
            status="error"
            title={t("worker.profile.rejected")}
            subTitle={
              profile.rejection_reason || t("worker.profile.rejectedDesc")
            }
            extra={[
              <Button
                key="edit"
                type="primary"
                onClick={() => setCurrentStep(0)}
              >
                {t("worker.profile.editProfile")}
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ margin: "40px auto", padding: "0 20px" }}>
      <Card>
        <Title level={2} style={{ textAlign: "center", marginBottom: 40 }}>
          {t("worker.profile.setupTitle")}
        </Title>

        <Steps
          current={currentStep}
          items={[
            {
              title: t("worker.profile.step1Title"),
              icon: <UserOutlined />,
              description: t("worker.profile.step1Desc"),
            },
            {
              title: t("worker.profile.step2Title"),
              icon: <ShoppingOutlined />,
              description: t("worker.profile.step2Desc"),
            },
            {
              title: t("worker.profile.submitTitle"),
              icon: <CheckCircleOutlined />,
              description: t("worker.profile.submitDesc"),
            },
          ]}
          style={{ marginBottom: 40 }}
        />

        <div style={{ marginTop: 40 }}>
          {currentStep === 0 && (
            <Step1BasicInfo
              profile={profile}
              onComplete={handleStep1Complete}
            />
          )}

          {currentStep === 1 && (
            <Step2ServicesAndPricing
              profile={profile}
              onComplete={handleStep2Complete}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {currentStep === 2 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CheckCircleOutlined
                style={{ fontSize: 64, color: "#52c41a", marginBottom: 24 }}
              />
              <Title level={3}>{t("worker.profile.readyToSubmit")}</Title>
              <Paragraph style={{ fontSize: 16, marginBottom: 32 }}>
                {t("worker.profile.readyToSubmitDesc")}
              </Paragraph>
              <Space>
                <Button size="large" onClick={() => setCurrentStep(1)}>
                  {t("common.back")}
                </Button>
                <Button
                  type="primary"
                  size="large"
                  loading={submitting}
                  onClick={handleSubmitForReview}
                >
                  {t("worker.profile.submitForReview")}
                </Button>
              </Space>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
