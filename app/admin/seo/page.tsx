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
  Modal,
  Table,
  Tag,
  Upload,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  GlobalOutlined,
  EyeOutlined,
  HistoryOutlined,
  DownloadOutlined,
  UploadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ImageUpload from "@/components/common/ImageUpload";
import { getErrorMessage } from "@/lib/utils/common";
import Loading from "@/components/common/Loading";
import {
  adminSEOAPI,
  type SEOSettings,
  type SEOHistoryRecord,
} from "@/lib/admin/seo-api";
import { isValidEmail } from "@/lib/auth/input-validation";
import dayjs from "dayjs";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SEOSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SEOHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const { t } = useTranslation();

  const fetchSettings = useCallback(async () => {
    try {
      const data = await adminSEOAPI.getSettings();
      if (data) {
        form.setFieldsValue(data);
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

  // URL validation function
  const validateUrl = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    try {
      const url = new URL(value);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return Promise.reject(new Error("URL must start with http:// or https://"));
      }
      return Promise.resolve();
    } catch {
      return Promise.reject(new Error("Invalid URL format"));
    }
  };

  // Email validation function
  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }
    if (!isValidEmail(value)) {
      return Promise.reject(new Error("Invalid email format"));
    }
    return Promise.resolve();
  };

  const handleSave = async (values: SEOSettings) => {
    setLoading(true);
    try {
      await adminSEOAPI.saveSettings(values, changeReason || undefined);
      message.success(t("admin.seo.saveSuccess"));
      setChangeReason("");
      // Refresh history if modal is open
      if (showHistory) {
        fetchHistory();
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Unknown error");
      message.error(t("admin.seo.saveFailed") + ": " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const historyData = await adminSEOAPI.getHistory(50);
      setHistory(historyData);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Unknown error");
      message.error("Failed to load history: " + errorMessage);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRollback = async (versionId: string, versionNumber: number) => {
    try {
      const settings = await adminSEOAPI.rollbackToVersion(
        versionId,
        `Rolled back to version ${versionNumber}`
      );
      form.setFieldsValue(settings);
      message.success(`Rolled back to version ${versionNumber}`);
      setShowHistory(false);
      fetchHistory();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Unknown error");
      message.error("Failed to rollback: " + errorMessage);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await adminSEOAPI.exportSettings();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seo-settings-${dayjs().format("YYYY-MM-DD-HHmmss")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("Settings exported successfully");
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, "Unknown error");
      message.error("Failed to export: " + errorMessage);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const settings = data.settings || data;

      // Validate settings structure
      if (!settings.siteName || typeof settings !== "object") {
        message.error("Invalid settings file format");
        return;
      }

      Modal.confirm({
        title: "Import SEO Settings",
        content: "This will replace your current settings. Are you sure?",
        onOk: async () => {
          try {
            await adminSEOAPI.importSettings(
              settings,
              `Imported from file: ${file.name}`
            );
            form.setFieldsValue(settings);
            message.success("Settings imported successfully");
            if (showHistory) {
              fetchHistory();
            }
          } catch (error: unknown) {
            const errorMessage = getErrorMessage(error, "Unknown error");
            message.error("Failed to import: " + errorMessage);
          }
        },
      });
    } catch (error: unknown) {
      message.error("Failed to parse JSON file");
    }
    return false; // Prevent default upload
  };

  const historyColumns: ColumnsType<SEOHistoryRecord> = [
    {
      title: "Version",
      dataIndex: "version_number",
      key: "version_number",
      width: 100,
      render: (version: number) => <Tag color="blue">v{version}</Tag>,
    },
    {
      title: "Changed By",
      key: "changed_by",
      width: 200,
      render: (_, record) => (
        <div>
          <div>{record.user?.full_name || record.user?.email || "Unknown"}</div>
          {record.user?.email && record.user?.full_name && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user.email}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Change Reason",
      dataIndex: "change_reason",
      key: "change_reason",
      ellipsis: true,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="Rollback to this version?"
          description="This will replace your current settings with this version."
          onConfirm={() => handleRollback(record.id, record.version_number)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="link"
            icon={<RollbackOutlined />}
            size="small"
          >
            Rollback
          </Button>
        </Popconfirm>
      ),
    },
  ];

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

          <Form.Item
            label={t("admin.seo.fields.ogImage")}
            name="ogImage"
            rules={[
              {
                validator: (_: any, value: string) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  // Validate image URL format
                  try {
                    const url = new URL(value);
                    if (url.protocol !== "http:" && url.protocol !== "https:") {
                      return Promise.reject(
                        new Error("Image URL must start with http:// or https://")
                      );
                    }
                    // Check if it's an image URL (basic check)
                    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
                    const hasImageExtension = imageExtensions.some((ext) =>
                      url.pathname.toLowerCase().endsWith(ext)
                    );
                    if (!hasImageExtension && !url.pathname.includes("image")) {
                      return Promise.reject(
                        new Error("URL should point to an image file")
                      );
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("Invalid image URL format"));
                  }
                },
              },
            ]}
          >
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
          <Form.Item
            label={t("admin.seo.fields.headerLogo")}
            name="headerLogo"
            rules={[
              {
                validator: (_: any, value: string) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  // Validate image URL format
                  try {
                    const url = new URL(value);
                    if (url.protocol !== "http:" && url.protocol !== "https:") {
                      return Promise.reject(
                        new Error("Logo URL must start with http:// or https://")
                      );
                    }
                    // Check if it's an image URL (basic check)
                    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
                    const hasImageExtension = imageExtensions.some((ext) =>
                      url.pathname.toLowerCase().endsWith(ext)
                    );
                    if (!hasImageExtension && !url.pathname.includes("image")) {
                      return Promise.reject(
                        new Error("URL should point to an image file")
                      );
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error("Invalid logo URL format"));
                  }
                },
              },
            ]}
          >
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
            rules={[
              {
                validator: validateEmail,
              },
            ]}
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
            rules={[
              {
                validator: validateEmail,
              },
            ]}
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
            rules={[
              {
                validator: validateUrl,
              },
            ]}
          >
            <Input placeholder="https://facebook.com/pr1as" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.twitterUrl")}
            name="twitterUrl"
            rules={[
              {
                validator: validateUrl,
              },
            ]}
          >
            <Input placeholder="https://twitter.com/pr1as" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.instagramUrl")}
            name="instagramUrl"
            rules={[
              {
                validator: validateUrl,
              },
            ]}
          >
            <Input placeholder="https://instagram.com/pr1as" />
          </Form.Item>

          <Form.Item
            label={t("admin.seo.fields.linkedinUrl")}
            name="linkedinUrl"
            rules={[
              {
                validator: validateUrl,
              },
            ]}
          >
            <Input placeholder="https://linkedin.com/company/pr1as" />
          </Form.Item>
        </Space>
      ),
    },
    {
      key: "history",
      label: (
        <span>
          <HistoryOutlined /> History
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={() => {
              setShowHistory(true);
              fetchHistory();
            }}
          >
            View History
          </Button>
          <Text type="secondary">
            View and rollback to previous versions of SEO settings
          </Text>
        </Space>
      ),
    },
  ];

  const getPreviewData = (): SEOSettings => {
    return form.getFieldsValue() as SEOSettings;
  };

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

          <Form.Item
            label="Change Reason (Optional)"
            style={{ marginTop: 24 }}
          >
            <Input
              placeholder="Describe what changed and why..."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space wrap>
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => setShowPreview(!showPreview)}
                size="large"
              >
                {showPreview ? "Hide Preview" : "Preview SEO"}
              </Button>
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                size="large"
              >
                Export JSON
              </Button>
              <Upload
                accept=".json"
                beforeUpload={handleImport}
                showUploadList={false}
              >
                <Button
                  type="default"
                  icon={<UploadOutlined />}
                  size="large"
                >
                  Import JSON
                </Button>
              </Upload>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                {t("admin.seo.saveButton")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {showPreview && (
        <Card
          title="SEO Preview"
          style={{ marginTop: 24 }}
          extra={
            <Button onClick={() => setShowPreview(false)}>Close</Button>
          }
        >
          <div style={{ border: "1px solid #d9d9d9", padding: 16, borderRadius: 4 }}>
            {/* Meta Tags Preview */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>Meta Tags:</Text>
              <div style={{ marginTop: 8, fontFamily: "monospace", fontSize: 12 }}>
                <div>
                  &lt;title&gt;{getPreviewData().siteTitle || "Site Title"}&lt;/title&gt;
                </div>
                <div>
                  &lt;meta name="description" content="
                  {getPreviewData().siteDescription || "Site Description"}
                  " /&gt;
                </div>
                <div>
                  &lt;meta name="keywords" content="
                  {getPreviewData().siteKeywords || "keywords"}
                  " /&gt;
                </div>
                {getPreviewData().ogImage && (
                  <div>
                    &lt;meta property="og:image" content="
                    {getPreviewData().ogImage}
                    " /&gt;
                  </div>
                )}
              </div>
            </div>

            {/* Header Preview */}
            <div style={{ marginBottom: 16, borderTop: "1px solid #d9d9d9", paddingTop: 16 }}>
              <Text strong>Header:</Text>
              <div style={{ marginTop: 8 }}>
                {getPreviewData().headerLogo && (
                  <img
                    src={getPreviewData().headerLogo}
                    alt="Logo"
                    style={{ maxHeight: 50, marginRight: 12 }}
                  />
                )}
                <span>{getPreviewData().siteName || "Site Name"}</span>
              </div>
              {getPreviewData().headerTagline && (
                <div style={{ marginTop: 4, color: "#666" }}>
                  {getPreviewData().headerTagline}
                </div>
              )}
              <div style={{ marginTop: 8, fontSize: 12 }}>
                {getPreviewData().headerContactPhone && (
                  <span style={{ marginRight: 16 }}>
                    📞 {getPreviewData().headerContactPhone}
                  </span>
                )}
                {getPreviewData().headerContactEmail && (
                  <span>✉️ {getPreviewData().headerContactEmail}</span>
                )}
              </div>
            </div>

            {/* Footer Preview */}
            <div style={{ borderTop: "1px solid #d9d9d9", paddingTop: 16 }}>
              <Text strong>Footer:</Text>
              <div style={{ marginTop: 8 }}>
                <div>{getPreviewData().footerCompanyName || "Company Name"}</div>
                {getPreviewData().footerAddress && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {getPreviewData().footerAddress}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  {getPreviewData().footerPhone && (
                    <span style={{ marginRight: 16 }}>
                      📞 {getPreviewData().footerPhone}
                    </span>
                  )}
                  {getPreviewData().footerEmail && (
                    <span>✉️ {getPreviewData().footerEmail}</span>
                  )}
                </div>
                {getPreviewData().footerAbout && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {getPreviewData().footerAbout}
                  </div>
                )}
                <div style={{ marginTop: 8, fontSize: 11, color: "#999" }}>
                  {getPreviewData().footerCopyright || "© 2024"}
                </div>
                {/* Social Media Links */}
                {(getPreviewData().facebookUrl ||
                  getPreviewData().twitterUrl ||
                  getPreviewData().instagramUrl ||
                  getPreviewData().linkedinUrl) && (
                  <div style={{ marginTop: 12 }}>
                    <Text strong style={{ fontSize: 12 }}>Social Media:</Text>
                    <div style={{ marginTop: 4 }}>
                      {getPreviewData().facebookUrl && (
                        <a
                          href={getPreviewData().facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: 12, fontSize: 12 }}
                        >
                          Facebook
                        </a>
                      )}
                      {getPreviewData().twitterUrl && (
                        <a
                          href={getPreviewData().twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: 12, fontSize: 12 }}
                        >
                          Twitter
                        </a>
                      )}
                      {getPreviewData().instagramUrl && (
                        <a
                          href={getPreviewData().instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginRight: 12, fontSize: 12 }}
                        >
                          Instagram
                        </a>
                      )}
                      {getPreviewData().linkedinUrl && (
                        <a
                          href={getPreviewData().linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 12 }}
                        >
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* History Modal */}
      <Modal
        title="SEO Settings History"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={[
          <Button key="close" onClick={() => setShowHistory(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        <Table
          columns={historyColumns}
          dataSource={history}
          loading={historyLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} versions`,
          }}
        />
      </Modal>
    </div>
  );
}
