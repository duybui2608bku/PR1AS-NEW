/**
 * EXAMPLES: How to use ImageUpload component
 * 
 * This file contains examples of how to use the ImageUpload component
 * in different scenarios.
 */

"use client";

import { useState } from "react";
import ImageUpload from "./ImageUpload";
import { Card, Typography } from "antd";

const { Title, Paragraph } = Typography;

export default function ImageUploadExamples() {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [avatarPath, setAvatarPath] = useState<string>();
  
  const [imageUrl, setImageUrl] = useState<string>();
  const [imagePath, setImagePath] = useState<string>();

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>ImageUpload Component Examples</Title>

      {/* Example 1: Avatar Upload */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>1. Avatar Upload</Title>
        <Paragraph>
          Upload user avatar. Images are stored in the "avatar" folder.
        </Paragraph>
        <ImageUpload
          type="avatar"
          folder="avatar"
          value={avatarUrl}
          onChange={(url, path) => {
            setAvatarUrl(url);
            setAvatarPath(path);
          }}
          avatarSize={120}
          showDelete={true}
        />
        <Paragraph style={{ marginTop: 16 }}>
          <strong>Current URL:</strong> {avatarUrl || "None"}<br />
          <strong>Current Path:</strong> {avatarPath || "None"}
        </Paragraph>
        <Paragraph>
          <strong>Usage:</strong>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<ImageUpload
  type="avatar"
  folder="avatar"
  value={avatarUrl}
  onChange={(url, path) => {
    setAvatarUrl(url);
    setAvatarPath(path);
  }}
  avatarSize={120}
  showDelete={true}
/>`}
          </pre>
        </Paragraph>
      </Card>

      {/* Example 2: General Image Upload */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>2. General Image Upload</Title>
        <Paragraph>
          Upload general images. Images are stored in the "general" folder.
        </Paragraph>
        <ImageUpload
          type="image"
          folder="general"
          value={imageUrl}
          onChange={(url, path) => {
            setImageUrl(url);
            setImagePath(path);
          }}
          imageWidth={400}
          imageHeight={300}
          showDelete={true}
        />
        <Paragraph style={{ marginTop: 16 }}>
          <strong>Current URL:</strong> {imageUrl || "None"}<br />
          <strong>Current Path:</strong> {imagePath || "None"}
        </Paragraph>
        <Paragraph>
          <strong>Usage:</strong>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<ImageUpload
  type="image"
  folder="general"
  value={imageUrl}
  onChange={(url, path) => {
    setImageUrl(url);
    setImagePath(path);
  }}
  imageWidth={400}
  imageHeight={300}
  showDelete={true}
/>`}
          </pre>
        </Paragraph>
      </Card>

      {/* Example 3: Product Image Upload */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>3. Product/Service Image Upload</Title>
        <Paragraph>
          Upload product or service images. Images are stored in custom folders.
        </Paragraph>
        <ImageUpload
          type="image"
          folder="products"
          imageWidth="100%"
          imageHeight="auto"
          showDelete={true}
          buttonText="Tải ảnh sản phẩm"
        />
        <Paragraph>
          <strong>Usage:</strong>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<ImageUpload
  type="image"
  folder="products"
  imageWidth="100%"
  imageHeight="auto"
  showDelete={true}
  buttonText="Tải ảnh sản phẩm"
/>`}
          </pre>
        </Paragraph>
      </Card>

      {/* Example 4: Small Avatar */}
      <Card>
        <Title level={4}>4. Small Avatar (No Delete Button)</Title>
        <Paragraph>
          Smaller avatar without delete button.
        </Paragraph>
        <ImageUpload
          type="avatar"
          folder="avatar"
          avatarSize={64}
          showDelete={false}
          buttonText="Chọn ảnh"
        />
        <Paragraph>
          <strong>Usage:</strong>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<ImageUpload
  type="avatar"
  folder="avatar"
  avatarSize={64}
  showDelete={false}
  buttonText="Chọn ảnh"
/>`}
          </pre>
        </Paragraph>
      </Card>

      {/* Props Documentation */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Props Documentation</Title>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: 8, border: "1px solid #ddd", textAlign: "left" }}>Prop</th>
              <th style={{ padding: 8, border: "1px solid #ddd", textAlign: "left" }}>Type</th>
              <th style={{ padding: 8, border: "1px solid #ddd", textAlign: "left" }}>Default</th>
              <th style={{ padding: 8, border: "1px solid #ddd", textAlign: "left" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>value</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>string</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>undefined</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Current image URL</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>onChange</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>function</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>undefined</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Callback when image changes</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>folder</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>string</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>"general"</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Upload folder (avatar, general, products, etc.)</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>type</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>"avatar" | "image"</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>"image"</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Display type</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>avatarSize</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>number</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>100</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Avatar size (only for type="avatar")</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>imageWidth</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>number | string</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>"100%"</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Image width (only for type="image")</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>imageHeight</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>number | string</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>"auto"</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Image height (only for type="image")</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>showDelete</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>boolean</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>true</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Show delete button</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>buttonText</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>string</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>auto</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Custom button text</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>accept</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>string</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>image/*</td>
              <td style={{ padding: 8, border: "1px solid #ddd" }}>Accept file types</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}

