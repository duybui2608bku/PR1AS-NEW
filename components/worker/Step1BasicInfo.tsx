"use client";

import { useState } from "react";
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
  TimePicker,
  Radio,
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
import { DayOfWeek, AvailabilityType, TagType } from "@/lib/utils/enums";
import dayjs, { Dayjs } from "dayjs";

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

const DAY_NAMES: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Monday",
  [DayOfWeek.TUESDAY]: "Tuesday",
  [DayOfWeek.WEDNESDAY]: "Wednesday",
  [DayOfWeek.THURSDAY]: "Thursday",
  [DayOfWeek.FRIDAY]: "Friday",
  [DayOfWeek.SATURDAY]: "Saturday",
  [DayOfWeek.SUNDAY]: "Sunday",
};

export default function Step1BasicInfo({ profile, onComplete }: Step1BasicInfoProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>(profile?.tags?.map(t => t.tag_key) || []);
  const [newTag, setNewTag] = useState("");

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
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Prepare tags data
      const tagsData = tags.map(tag => ({
        tag_key: tag,
        tag_value: tag,
        tag_type: TagType.INTEREST,
      }));

      // Prepare availabilities data (simplified - can be enhanced)
      const availabilitiesData: any[] = [];

      // For now, we'll add a simple all-day availability for weekdays
      // This can be enhanced with a more complex availability picker
      [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY].forEach(day => {
        availabilitiesData.push({
          day_of_week: day,
          availability_type: AvailabilityType.ALL_DAY,
        });
      });

      const requestData: WorkerProfileStep1Request = {
        full_name: values.full_name,
        nickname: values.nickname,
        age: values.age,
        height_cm: values.height_cm,
        weight_kg: values.weight_kg,
        zodiac_sign: values.zodiac_sign,
        lifestyle: values.lifestyle,
        personal_quote: values.personal_quote,
        bio: values.bio,
        tags: tagsData,
        availabilities: availabilitiesData,
      };

      await workerProfileAPI.saveProfile(requestData);
      showMessage.success(t("worker.profile.step1SaveSuccess"));
      onComplete();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showMessage.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                  { type: "number", min: 18, max: 100, message: t("worker.profile.ageRange") },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="25"
                  min={18}
                  max={100}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={t("worker.profile.height")}
                name="height_cm"
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="170"
                  min={100}
                  max={250}
                  addonAfter="cm"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={t("worker.profile.weight")}
                name="weight_kg"
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="65"
                  min={30}
                  max={300}
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
          >
            <Input
              size="large"
              placeholder={t("worker.profile.personalQuotePlaceholder")}
              maxLength={200}
            />
          </Form.Item>

          <Form.Item
            label={t("worker.profile.bio")}
            name="bio"
          >
            <TextArea
              rows={4}
              placeholder={t("worker.profile.bioPlaceholder")}
              maxLength={1000}
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

        <Divider />

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button size="large" type="primary" htmlType="submit" loading={loading}>
              {t("common.saveAndContinue")}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
