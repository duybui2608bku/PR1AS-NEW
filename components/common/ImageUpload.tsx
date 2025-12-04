"use client";

import { useEffect, useState } from "react";
import { Upload, Avatar, Button, message, Spin } from "antd";
import {
  UploadOutlined,
  UserOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { UploadProps } from "antd";
import {
  uploadImage,
  deleteImage,
  validateImage,
} from "@/lib/utils/image-upload";
import { useTranslation } from "react-i18next";

interface ImageUploadProps {
  /**
   * Current image URL
   */
  value?: string;

  /**
   * Callback when image changes
   */
  onChange?: (url: string | undefined, filePath?: string) => void;

  /**
   * Upload folder (avatar, general, etc.)
   */
  folder?: string;

  /**
   * Display type: avatar or image
   */
  type?: "avatar" | "image";

  /**
   * Avatar size (only for type="avatar")
   */
  avatarSize?: number;

  /**
   * Image width (only for type="image")
   */
  imageWidth?: number | string;

  /**
   * Image height (only for type="image")
   */
  imageHeight?: number | string;

  /**
   * Show delete button
   */
  showDelete?: boolean;

  /**
   * Button text
   */
  buttonText?: string;

  /**
   * Accept file types
   */
  accept?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "general",
  type = "image",
  avatarSize = 100,
  imageWidth = "100%",
  imageHeight = "auto",
  showDelete = true,
  buttonText,
  accept = "image/jpeg,image/jpg,image/png,image/webp,image/gif",
}: ImageUploadProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);
  const [filePath, setFilePath] = useState<string | undefined>(value);

  // Đồng bộ lại state nội bộ khi prop value thay đổi (ví dụ: load từ API)
  useEffect(() => {
    setImageUrl(value);
  }, [value]);

  const handleUpload = async (file: File) => {
    // Validate file with i18n messages
    const validation = validateImage(file, {
      invalidType: t("upload.image.messages.invalidType"),
      fileTooLarge: t("upload.image.messages.fileTooLarge"),
    });
    if (!validation.valid) {
      message.error(validation.error);
      return false;
    }

    setLoading(true);

    try {
      // Upload file
      const result = await uploadImage(file, folder);

      if (result.success && result.data) {
        const newImageUrl = result.data.publicUrl;
        const newFilePath = result.data.path;

        setImageUrl(newImageUrl);
        setFilePath(newFilePath);

        // Call onChange callback
        if (onChange) {
          onChange(newImageUrl, newFilePath);
        }

        message.success(t("upload.image.messages.uploadSuccess"));
      } else {
        message.error(result.error || t("upload.image.messages.uploadFailed"));
      }
    } catch {
      message.error(t("upload.image.messages.uploadError"));
    } finally {
      setLoading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleDelete = async () => {
    if (!filePath) {
      // If no file path, just clear the image
      setImageUrl(undefined);
      if (onChange) {
        onChange(undefined);
      }
      return;
    }

    setLoading(true);

    try {
      const result = await deleteImage(filePath);

      if (result.success) {
        setImageUrl(undefined);
        setFilePath(undefined);

        // Call onChange callback
        if (onChange) {
          onChange(undefined);
        }

        message.success(t("upload.image.messages.deleteSuccess"));
      } else {
        message.error(result.error || t("upload.image.messages.deleteFailed"));
      }
    } catch {
      message.error(t("upload.image.messages.deleteError"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    accept,
    showUploadList: false,
    beforeUpload: handleUpload,
  };

  // Render Avatar type
  if (type === "avatar") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ position: "relative" }}>
          <Avatar
            size={avatarSize}
            src={imageUrl}
            icon={!imageUrl && <UserOutlined />}
            style={{
              backgroundColor: !imageUrl ? "#87d068" : undefined,
            }}
          />
          {loading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                borderRadius: "50%",
              }}
            >
              <Spin
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: 24, color: "#fff" }}
                    spin
                  />
                }
              />
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Upload {...uploadProps}>
            <Button
              icon={<UploadOutlined />}
              loading={loading}
              disabled={loading}
            >
              {buttonText || t("upload.image.button.upload")}
            </Button>
          </Upload>

          {showDelete && imageUrl && (
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
              loading={loading}
              disabled={loading}
            >
              {t("upload.image.button.delete")}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Render Image type
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {imageUrl && (
        <div
          style={{
            position: "relative",
            width: imageWidth,
            height: imageHeight,
            maxHeight: 300,
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid #d9d9d9",
          }}
        >
          <img
            src={imageUrl}
            alt="Uploaded"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {loading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            >
              <Spin
                indicator={
                  <LoadingOutlined
                    style={{ fontSize: 32, color: "#fff" }}
                    spin
                  />
                }
              />
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Upload {...uploadProps}>
          <Button
            icon={<UploadOutlined />}
            loading={loading}
            disabled={loading}
          >
            {buttonText ||
              (imageUrl
                ? t("upload.image.button.change")
                : t("upload.image.button.upload"))}
          </Button>
        </Upload>

        {showDelete && imageUrl && (
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={handleDelete}
            loading={loading}
            disabled={loading}
          >
            {t("upload.image.button.delete")}
          </Button>
        )}
      </div>
    </div>
  );
}
