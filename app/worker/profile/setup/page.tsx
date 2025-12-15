"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, Steps, Button, Typography, Space, Spin, Alert } from "antd";
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
import { useRetry } from "@/lib/hooks/useRetry";
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
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>(
    []
  );

  // Retry logic for loading profile
  const { execute: loadProfileWithRetry } = useRetry(
    workerProfileAPI.getProfile,
    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt) => {
        showMessage.warning(t("common.retrying", { attempt }));
      },
    }
  );

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setStepValidationErrors([]);
      const profileData = await loadProfileWithRetry();

      // Profile doesn't exist yet (first time setup)
      if (!profileData) {
        setProfile(null);
        setCurrentStep(0);
        return;
      }

      setProfile(profileData);

      // Determine current step based on profile_completed_steps
      // Allow editing regardless of status
      if (profileData.profile_completed_steps === 0) {
        setCurrentStep(0);
      } else if (
        profileData.profile_completed_steps >= 1 &&
        profileData.profile_completed_steps < 3
      ) {
        setCurrentStep(1);
      } else if (profileData.profile_completed_steps === 3) {
        // Both steps completed
        // If status is DRAFT, show submit page
        // Otherwise, allow editing from step 0 or 1
        if (profileData.profile_status === WorkerProfileStatus.DRAFT) {
          setCurrentStep(2); // Show submit page
        } else {
          // Profile is pending/approved/published/rejected - allow editing from step 0
          setCurrentStep(0);
        }
      }
    } catch (error) {
      // Handle network errors or other errors
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        showMessage.error(t("common.networkError"));
        setStepValidationErrors([t("common.networkError")]);
      } else if (
        !errorMessage.includes("404") &&
        !errorMessage.includes("not found")
      ) {
        showMessage.error(errorMessage);
        setStepValidationErrors([errorMessage]);
      }
      // Profile doesn't exist yet or error occurred, start from step 0
      setProfile(null);
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  // Validate step before navigation
  const validateStep = useCallback(
    (step: number): boolean => {
      if (!profile) return true; // Allow navigation if no profile

      const errors: string[] = [];

      if (step === 1) {
        // Validate step 1 completion
        if (!profile.full_name || !profile.age) {
          errors.push(t("worker.profile.step1Incomplete"));
        }
      } else if (step === 2) {
        // Validate step 2 completion
        if (!profile.avatar) {
          errors.push(t("worker.profile.avatarRequired"));
        }
        if (!profile.services || profile.services.length === 0) {
          errors.push(t("worker.profile.atLeastOneService"));
        }
      }

      if (errors.length > 0) {
        setStepValidationErrors(errors);
        showMessage.error(errors[0]);
        return false;
      }

      setStepValidationErrors([]);
      return true;
    },
    [profile, t]
  );

  const handleStep1Complete = useCallback(async () => {
    try {
      await loadProfile();
      if (validateStep(1)) {
        setCurrentStep(1);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showMessage.error(errorMessage);
    }
  }, [validateStep]);

  const handleStep2Complete = useCallback(async () => {
    try {
      await loadProfile();
      if (validateStep(2)) {
        setCurrentStep(2);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showMessage.error(errorMessage);
    }
  }, [validateStep]);

  // Retry logic for submit
  const { execute: submitWithRetry } = useRetry(
    workerProfileAPI.submitForReview,
    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt) => {
        showMessage.warning(t("common.retrying", { attempt }));
      },
    }
  );

  const handleSubmitForReview = useCallback(async () => {
    // Final validation before submit
    if (!validateStep(2)) {
      return;
    }

    try {
      setSubmitting(true);
      await submitWithRetry();
      showMessage.success(t("worker.profile.submitSuccess"));
      router.push("/worker/dashboard");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("timeout")
      ) {
        showMessage.error(t("common.networkError"));
      } else if (errorMessage.includes("429")) {
        showMessage.error(t("common.tooManyRequests"));
      } else {
        showMessage.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }, [validateStep, submitWithRetry, router, t]);

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

  // Determine if profile needs re-review after editing
  const needsReReview =
    profile &&
    [WorkerProfileStatus.APPROVED, WorkerProfileStatus.PUBLISHED].includes(
      profile.profile_status
    );

  // Show status info if profile is not in draft
  const showStatusInfo =
    profile && profile.profile_status !== WorkerProfileStatus.DRAFT;

  return (
    <div style={{ margin: "40px auto", padding: "0 20px" }}>
      <Card>
        <Title level={2} style={{ textAlign: "center", marginBottom: 40 }}>
          {t("worker.profile.setupTitle")}
        </Title>

        {stepValidationErrors.length > 0 && (
          <Alert
            message={t("common.validationErrors")}
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {stepValidationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            closable
            onClose={() => setStepValidationErrors([])}
            style={{ marginBottom: 24 }}
          />
        )}

        {showStatusInfo && (
          <Alert
            message={
              profile.profile_status === WorkerProfileStatus.PENDING
                ? t("worker.profile.underReview")
                : profile.profile_status === WorkerProfileStatus.APPROVED
                ? t("worker.profile.approved")
                : profile.profile_status === WorkerProfileStatus.PUBLISHED
                ? t("worker.profile.published")
                : profile.profile_status === WorkerProfileStatus.REJECTED
                ? t("worker.profile.rejected")
                : ""
            }
            description={
              profile.profile_status === WorkerProfileStatus.REJECTED
                ? profile.rejection_reason || t("worker.profile.rejectedDesc")
                : needsReReview
                ? t("worker.profile.editWillRequireReview")
                : profile.profile_status === WorkerProfileStatus.PENDING
                ? t("worker.profile.underReviewDesc")
                : ""
            }
            type={
              profile.profile_status === WorkerProfileStatus.REJECTED
                ? "error"
                : profile.profile_status === WorkerProfileStatus.PUBLISHED
                ? "success"
                : "info"
            }
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {needsReReview && (
          <Alert
            message={t("worker.profile.editWarning")}
            description={t("worker.profile.editWarningDesc")}
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

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
