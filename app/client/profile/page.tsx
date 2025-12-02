"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  DatePicker,
  Typography,
  Spin,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import ImageUpload from "@/components/common/ImageUpload";
import { useTranslation } from "react-i18next";
import { clientAPI, type ClientProfileSettings } from "@/lib/client/api-client";
import { showNotification } from "@/lib/utils/toast";

const { Title, Paragraph } = Typography;
const { Option } = Select;

export default function ClientProfilePage() {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await clientAPI.getProfile();
        setAvatarUrl(profile.avatar_url || undefined);
        form.setFieldsValue({
          full_name: profile.full_name ?? "",
          gender: profile.gender ?? undefined,
          date_of_birth: profile.date_of_birth
            ? dayjs(profile.date_of_birth)
            : undefined,
          country: profile.country ?? undefined,
          language: profile.language ?? undefined,
          address: profile.address ?? "",
        });
      } catch {
        showNotification.error(
          "Không thể tải thông tin hồ sơ",
          "Vui lòng thử lại sau. Nếu lỗi tiếp tục xảy ra, hãy liên hệ hỗ trợ."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [form]);

  const handleSubmit = async (values: {
    full_name?: string;
    gender?: string;
    date_of_birth?: Dayjs;
    country?: string;
    language?: string;
    address?: string;
  }) => {
    setSaving(true);
    try {
      const payload: ClientProfileSettings = {
        full_name: values.full_name ?? null,
        avatar_url: avatarUrl ?? null,
        gender: values.gender ?? null,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
        country: values.country ?? null,
        language: values.language ?? null,
        address: values.address ?? null,
      };

      await clientAPI.updateProfile(payload);
      showNotification.success("Lưu thông tin hồ sơ thành công");
    } catch (error: any) {
      showNotification.error(
        "Lưu thông tin hồ sơ thất bại",
        error?.message || "Vui lòng kiểm tra lại thông tin và thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 200,
        }}
      >
        <Spin />
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>
        {t("client.profile.title") || "Thiết lập thông tin cơ bản"}
      </Title>
      <Paragraph type="secondary">
        {t("client.profile.description") ||
          "Cập nhật các thông tin hồ sơ cơ bản để trải nghiệm đặt dịch vụ tốt hơn."}
      </Paragraph>

      <Card style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                label={t("client.profile.avatar") || "Ảnh đại diện"}
                name="avatar"
              >
                <ImageUpload
                  type="avatar"
                  folder="avatar"
                  value={avatarUrl}
                  onChange={(url) => setAvatarUrl(url)}
                  avatarSize={120}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label={t("client.profile.fullName") || "Họ và tên"}
                    name="full_name"
                    rules={[
                      {
                        required: true,
                        message:
                          t("client.profile.fullNameRequired") ||
                          "Vui lòng nhập họ và tên",
                      },
                    ]}
                  >
                    <Input
                      placeholder={
                        t("client.profile.fullNamePlaceholder") ||
                        "Nhập họ và tên"
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t("client.profile.gender") || "Giới tính"}
                    name="gender"
                  >
                    <Select
                      placeholder={
                        t("client.profile.genderPlaceholder") ||
                        "Chọn giới tính"
                      }
                      allowClear
                    >
                      <Option value="male">
                        {t("client.profile.genderMale") || "Nam"}
                      </Option>
                      <Option value="female">
                        {t("client.profile.genderFemale") || "Nữ"}
                      </Option>
                      <Option value="other">
                        {t("client.profile.genderOther") || "Khác"}
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={t("client.profile.dateOfBirth") || "Ngày sinh"}
                    name="date_of_birth"
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format="YYYY-MM-DD"
                      placeholder={
                        t("client.profile.dateOfBirthPlaceholder") ||
                        "Chọn ngày sinh"
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("client.profile.country") || "Quốc gia"}
                name="country"
              >
                <Select
                  showSearch
                  allowClear
                  placeholder={
                    t("client.profile.countryPlaceholder") ||
                    "Chọn quốc gia cư trú"
                  }
                  optionFilterProp="children"
                >
                  <Option value="VN">Việt Nam</Option>
                  <Option value="US">Hoa Kỳ</Option>
                  <Option value="JP">Nhật Bản</Option>
                  <Option value="KR">Hàn Quốc</Option>
                  <Option value="CN">Trung Quốc</Option>
                  <Option value="OTHER">Quốc gia khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t("client.profile.language") || "Ngôn ngữ ưu tiên"}
                name="language"
              >
                <Select
                  allowClear
                  placeholder={
                    t("client.profile.languagePlaceholder") ||
                    "Chọn ngôn ngữ ưu tiên"
                  }
                >
                  <Option value="vi">Tiếng Việt</Option>
                  <Option value="en">English</Option>
                  <Option value="zh">中文</Option>
                  <Option value="ko">한국어</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t("client.profile.address") || "Địa chỉ"}
            name="address"
          >
            <Input.TextArea
              rows={3}
              placeholder={
                t("client.profile.addressPlaceholder") ||
                "Nhập địa chỉ liên hệ (có thể chi tiết quận/huyện, thành phố...)"
              }
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={saving}
            >
              {t("common.save") || "Lưu thay đổi"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
