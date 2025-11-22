"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Tabs,
  Space,
  message,
} from "antd";
import { SaveOutlined, GlobalOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ImageUpload from "@/components/common/ImageUpload";
import { getErrorMessage } from "@/lib/utils/common";
import Loading from "@/components/common/Loading";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SEOSettings {
  // General SEO
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogImage: string;

  // Header Settings
  headerLogo: string;
  headerTagline: string;
  headerContactPhone: string;
  headerContactEmail: string;

  // Footer Settings
  footerCompanyName: string;
  footerAddress: string;
  footerPhone: string;
  footerEmail: string;
  footerCopyright: string;
  footerAbout: string;

  // Social Media
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
}

export default function SEOSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const { t } = useTranslation();

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings/seo");
      const result = await response.json();

      if (response.ok && result.data) {
        form.setFieldsValue(result.data);
      }
    } catch {
      message.warning("Could not load existing settings. Using defaults.");
    } finally {
      setFetchLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (values: SEOSettings) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings/seo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: values }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings");
      }

      message.success(t("admin.seo.saveSuccess"));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Unknown error");
      message.error(t("admin.seo.saveFailed") + ": " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <Loading variant="card" size="large" tip={t("common.loading")} />;
  }

  const tabItems = [
    {
      key: "general",
      label: (
        <span>
          <GlobalOutlined /> {t("admin.seo.tabs.general")}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Form.Item
            label={t("admin.seo.fields.siteName")}
            name="siteName"
            rules={[
              {
                required: true,
                message: t("admin.seo.fields.siteName") + " là bắt buộc",
              },
            ]}
          >
            <Input placeholder={t("admin.seo.placeholders.siteName")} />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.siteTitle")}
            name="siteTitle"
            rules={[
              {
                required: true,
                message: t("admin.seo.fields.siteTitle") + " là bắt buộc",
              },
            ]}
          >
            <Input placeholder={t("admin.seo.placeholders.siteTitle")} />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.siteDescription")}
            name="siteDescription"
            rules={[
              {
                required: true,
                message: t("admin.seo.fields.siteDescription") + " là bắt buộc",
              },
            ]}
          >
            <TextArea
              rows={3}
              placeholder={t("admin.seo.placeholders.siteDescription")}
            />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.siteKeywords")}
            name="siteKeywords"
          >
            <TextArea
              rows={2}
              placeholder={t("admin.seo.placeholders.siteKeywords")}
            />
          </Form.Item>

          <Form.Item label={t("admin.seo.fields.ogImage")} name="ogImage">
            <ImageUpload
              type="image"
              folder="seo"
              imageWidth="100%"
              imageHeight={200}
              buttonText={t("upload.image.button.choose")}
            />
          </Form.Item>
        </Space>
      ),
    },
    {
      key: "header",
      label: t("admin.seo.tabs.header"),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Form.Item label={t("admin.seo.fields.headerLogo")} name="headerLogo">
            <ImageUpload
              type="image"
              folder="logo"
              imageWidth={300}
              imageHeight={100}
              buttonText={t("upload.image.button.choose")}
            />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.headerTagline")}
            name="headerTagline"
          >
            <Input placeholder={t("admin.seo.placeholders.headerTagline")} />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.headerContactPhone")}
            name="headerContactPhone"
          >
            <Input placeholder="+84 xxx xxx xxx" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.headerContactEmail")}
            name="headerContactEmail"
          >
            <Input type="email" placeholder="contact@pr1as.com" />
          </Form.Item>
        </Space>
      ),
    },
    {
      key: "footer",
      label: t("admin.seo.tabs.footer"),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Form.Item
            label={t("admin.seo.fields.footerCompanyName")}
            name="footerCompanyName"
          >
            <Input placeholder="PR1AS Company Ltd." />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.footerAddress")}
            name="footerAddress"
          >
            <TextArea
              rows={2}
              placeholder={t("admin.seo.placeholders.footerAddress")}
            />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.footerPhone")}
            name="footerPhone"
          >
            <Input placeholder="+84 xxx xxx xxx" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.footerEmail")}
            name="footerEmail"
          >
            <Input type="email" placeholder="info@pr1as.com" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.footerAbout")}
            name="footerAbout"
          >
            <TextArea
              rows={3}
              placeholder={t("admin.seo.placeholders.footerAbout")}
            />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.footerCopyright")}
            name="footerCopyright"
          >
            <Input placeholder={t("admin.seo.placeholders.footerCopyright")} />
          </Form.Item>

          <Title level={5} style={{ marginTop: 24 }}>
            {t("admin.seo.fields.socialMedia")}
          </Title>

          <Form.Item
            label={t("admin.seo.fields.facebookUrl")}
            name="facebookUrl"
          >
            <Input placeholder="https://facebook.com/pr1as" />
          </Form.Item>

          <Form.Item label={t("admin.seo.fields.twitterUrl")} name="twitterUrl">
            <Input placeholder="https://twitter.com/pr1as" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.instagramUrl")}
            name="instagramUrl"
          >
            <Input placeholder="https://instagram.com/pr1as" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.linkedinUrl")}
            name="linkedinUrl"
          >
            <Input placeholder="https://linkedin.com/company/pr1as" />
          </Form.Item>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>{t("admin.seo.title")}</Title>
      <Text type="secondary">{t("admin.seo.subtitle")}</Text>

      <Card style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            siteName: t("admin.seo.placeholders.siteName"),
            siteTitle: t("admin.seo.placeholders.siteTitle"),
            siteDescription: t("admin.seo.placeholders.siteDescription"),
            siteKeywords: t("admin.seo.placeholders.siteKeywords"),
            footerCopyright: t("admin.seo.placeholders.footerCopyright"),
          }}
        >
          <Tabs items={tabItems} />

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              {t("admin.seo.saveButton")}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
