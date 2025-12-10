"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Card,
  Tag,
  Divider,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { getErrorMessage } from "@/lib/utils/common";
import { workerProfileAPI } from "@/lib/worker/api-client";
import {
  WorkerProfileComplete,
  WorkerProfileStep1Request,
} from "@/lib/worker/types";
import { TagType } from "@/lib/utils/enums";
import { validateStep1Profile, validateTags } from "@/lib/worker/validation";
import { PROFILE_CONSTRAINTS } from "@/lib/worker/constants";
import { useDebouncedCallback } from "@/lib/hooks/useDebounce";
import { useRetry } from "@/lib/hooks/useRetry";
import AvailabilityPicker from "@/components/worker/AvailabilityPicker";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface Step1BasicInfoProps {
  profile: WorkerProfileComplete | null;
  onComplete: () => void;
}

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const LIFESTYLE_OPTIONS = [
  "LIFESTYLE_ACTIVE",
  "LIFESTYLE_RELAXED",
  "LIFESTYLE_ADVENTUROUS",
  "LIFESTYLE_HOMEBODY",
  "LIFESTYLE_SOCIAL",
  "LIFESTYLE_INDEPENDENT",
];

export default function Step1BasicInfo({ profile, onComplete }: Step1BasicInfoProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>(profile?.tags?.map(t => t.tag_key) || []);
  const [newTag, setNewTag] = useState("");
  const [availabilities, setAvailabilities] = useState(
    profile?.availabilities || []
  );
  const [previousProfile, setPreviousProfile] = useState<WorkerProfileComplete | null>(profile);

  // Initialize availabilities from profile
  useEffect(() => {
    if (profile?.availabilities && profile.availabilities.length > 0) {
      setAvailabilities(profile.availabilities);
    }
  }, [profile?.availabilities]);

  // Retry logic for API calls
  const { execute: saveProfileWithRetry, loading: saving } = useRetry(
    workerProfileAPI.saveProfile,
    {
      maxRetries: 3,
      retryDelay: 1000,
      onRetry: (attempt) => {
        showMessage.warning(t("common.retrying", { attempt }));
      },
    }
  );

  // Initialize form with existing profile data
  const initialValues = profile
    ? {
        full_name: profile.full_name,
        nickname: profile.nickname,
        age: profile.age,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        zodiac_sign: profile.zodiac_sign,
        lifestyle: profile.lifestyle,
        personal_quote: profile.personal_quote,
        bio: profile.bio,
        // Availabilities will be handled separately
      }
    : {};

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) {
      showMessage.warning(t("worker.profile.tagEmpty"));
      return;
    }

    // Check for duplicates (case-insensitive)
    if (tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
      showMessage.warning(t("worker.profile.tagDuplicate"));
      return;
    }

    // Validate tag length
    if (trimmedTag.length > PROFILE_CONSTRAINTS.MAX_TAG_LENGTH) {
      showMessage.error(
        t("worker.profile.tagTooLong", {
          max: PROFILE_CONSTRAINTS.MAX_TAG_LENGTH,
        })
      );
      return;
    }

    // Check max tags limit
    if (tags.length >= PROFILE_CONSTRAINTS.MAX_TAGS) {
      showMessage.error(
        t("worker.profile.maxTagsReached", {
          max: PROFILE_CONSTRAINTS.MAX_TAGS,
        })
      );
      return;
    }

    setTags([...tags, trimmedTag]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = useCallback(async (values: any) => {
    // Prepare tags data
    const tagsData = tags.map(tag => ({
      tag_key: tag.trim(),
      tag_value: tag.trim(),
      tag_type: TagType.INTEREST,
    }));

    const requestData: WorkerProfileStep1Request = {
      full_name: values.full_name?.trim(),
      nickname: values.nickname?.trim(),
      age: values.age,
      height_cm: values.height_cm,
      weight_kg: values.weight_kg,
      zodiac_sign: values.zodiac_sign,
      lifestyle: values.lifestyle,
      personal_quote: values.personal_quote?.trim(),
      bio: values.bio?.trim(),
      tags: tagsData,
      availabilities: availabilities,
    };

    // Validate data before submitting
    const validation = validateStep1Profile(requestData);
    if (!validation.valid) {
      // Show first error
      const firstError = validation.errors[0];
      form.setFields([
        {
          name: firstError.field,
          errors: [firstError.message],
        },
      ]);
      showMessage.error(firstError.message);
      return;
    }

    // Optimistic update: save previous state for rollback
    const previousState = previousProfile;

    try {
      // Optimistic update: update local state immediately
      if (previousState) {
        setPreviousProfile({
          ...previousState,
          ...requestData,
        } as WorkerProfileComplete);
      }

      // Save with retry logic
      await saveProfileWithRetry(requestData);
      showMessage.success(t("worker.profile.step1SaveSuccess"));
      onComplete();
    } catch (error) {
      // Rollback on error
      if (previousState) {
        setPreviousProfile(previousState);
      }

      const errorMessage = getErrorMessage(error);
      
      // Show specific error messages
      if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
        showMessage.error(t("common.networkError"));
      } else if (errorMessage.includes("429")) {
        showMessage.error(t("common.tooManyRequests"));
      } else {
        showMessage.error(errorMessage);
      }
    }
  }, [tags, availabilities, form, previousProfile, saveProfileWithRetry, onComplete, t]);

  // Note: Form submission is handled by Ant Design Form, debouncing is done via button disable

  return (
    <div>
      <Title level={3}>{t("worker.profile.basicInfoTitle")}</Title>
      <Paragraph type="secondary">{t("worker.profile.basicInfoDesc")}</Paragraph>

      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        <Card title={t("worker.profile.personalInfo")} style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("worker.profile.fullName")}
                name="full_name"
                rules={[{ required: true, message: t("worker.profile.fullNameRequired") }]}
              >
                <Input size="large" placeholder={t("worker.profile.fullNamePlaceholder")} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t("worker.profile.nickname")}
                name="nickname"
              >
                <Input size="large" placeholder={t("worker.profile.nicknamePlaceholder")} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label={t("worker.profile.age")}
                name="age"
                rules={[
                  { required: true, message: t("worker.profile.ageRequired") },
                  {
                    type: "number",
                    min: PROFILE_CONSTRAINTS.MIN_AGE,
                    max: PROFILE_CONSTRAINTS.MAX_AGE,
                    message: t("worker.profile.ageRange"),
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="25"
                  min={PROFILE_CONSTRAINTS.MIN_AGE}
                  max={PROFILE_CONSTRAINTS.MAX_AGE}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={t("worker.profile.height")}
                name="height_cm"
                rules={[
                  {
                    type: "number",
                    min: PROFILE_CONSTRAINTS.MIN_HEIGHT_CM,
                    max: PROFILE_CONSTRAINTS.MAX_HEIGHT_CM,
                    message: t("worker.profile.heightRange"),
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="170"
                  min={PROFILE_CONSTRAINTS.MIN_HEIGHT_CM}
                  max={PROFILE_CONSTRAINTS.MAX_HEIGHT_CM}
                  addonAfter="cm"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={t("worker.profile.weight")}
                name="weight_kg"
                rules={[
                  {
                    type: "number",
                    min: PROFILE_CONSTRAINTS.MIN_WEIGHT_KG,
                    max: PROFILE_CONSTRAINTS.MAX_WEIGHT_KG,
                    message: t("worker.profile.weightRange"),
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="65"
                  min={PROFILE_CONSTRAINTS.MIN_WEIGHT_KG}
                  max={PROFILE_CONSTRAINTS.MAX_WEIGHT_KG}
                  addonAfter="kg"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("worker.profile.zodiacSign")}
                name="zodiac_sign"
              >
                <Select size="large" placeholder={t("worker.profile.zodiacSignPlaceholder")}>
                  {ZODIAC_SIGNS.map(sign => (
                    <Select.Option key={sign} value={sign}>
                      {sign}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                label={t("worker.profile.lifestyle")}
                name="lifestyle"
              >
                <Select size="large" placeholder={t("worker.profile.lifestylePlaceholder")}>
                  {LIFESTYLE_OPTIONS.map(lifestyle => (
                    <Select.Option key={lifestyle} value={lifestyle}>
                      {t(`worker.lifestyle.${lifestyle}`)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title={t("worker.profile.aboutYou")} style={{ marginBottom: 24 }}>
          <Form.Item
            label={t("worker.profile.personalQuote")}
            name="personal_quote"
            rules={[
              {
                max: PROFILE_CONSTRAINTS.MAX_QUOTE_LENGTH,
                message: t("worker.profile.quoteTooLong", {
                  max: PROFILE_CONSTRAINTS.MAX_QUOTE_LENGTH,
                }),
              },
            ]}
          >
            <Input
              size="large"
              placeholder={t("worker.profile.personalQuotePlaceholder")}
              maxLength={PROFILE_CONSTRAINTS.MAX_QUOTE_LENGTH}
              showCount
            />
          </Form.Item>

          <Form.Item
            label={t("worker.profile.bio")}
            name="bio"
            rules={[
              {
                max: PROFILE_CONSTRAINTS.MAX_BIO_LENGTH,
                message: t("worker.profile.bioTooLong", {
                  max: PROFILE_CONSTRAINTS.MAX_BIO_LENGTH,
                }),
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={t("worker.profile.bioPlaceholder")}
              maxLength={PROFILE_CONSTRAINTS.MAX_BIO_LENGTH}
              showCount
            />
          </Form.Item>

          <Form.Item label={t("worker.profile.interestsAndHobbies")}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  size="large"
                  placeholder={t("worker.profile.addTagPlaceholder")}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onPressEnter={handleAddTag}
                />
                <Button size="large" type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
                  {t("common.add")}
                </Button>
              </Space.Compact>

              <div>
                {tags.map(tag => (
                  <Tag
                    key={tag}
                    closable
                    onClose={() => handleRemoveTag(tag)}
                    style={{ marginBottom: 8 }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </Space>
          </Form.Item>
        </Card>

        {/* Temporarily hidden - Availability section */}
        {/* <Card title={t("worker.profile.availability")} style={{ marginBottom: 24 }}>
          <AvailabilityPicker
            value={availabilities}
            onChange={setAvailabilities}
          />
        </Card> */}

        <Divider />

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              size="large"
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={saving}
            >
              {t("common.saveAndContinue")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
