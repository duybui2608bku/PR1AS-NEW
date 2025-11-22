/**
 * Loading Component Examples
 * Demo các variant của Loading component
 */

"use client";

import { Card, Space, Typography, Divider } from "antd";
import Loading, {
  FullPageLoading,
  InlineLoading,
  SkeletonLoading,
} from "./Loading";

const { Title, Paragraph, Text } = Typography;

export default function LoadingExamples() {
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <Title level={2}>🔄 Loading Component Examples</Title>
      <Paragraph>
        Demo các variant của <Text code>Loading</Text> component.
      </Paragraph>

      <Divider />

      {/* Example 1: Spinner */}
      <Card title="1. Spinner (Default)" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph>Loading spinner đơn giản.</Paragraph>
          <Space>
            <Loading size="small" />
            <Loading size="default" />
            <Loading size="large" />
          </Space>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<Loading size="small" />
<Loading size="default" />
<Loading size="large" />`}
          </pre>
        </Space>
      </Card>

      {/* Example 2: Inline */}
      <Card title="2. Inline Loading" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph>Loading trong container.</Paragraph>
          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20 }}>
            <InlineLoading tip="Đang tải dữ liệu..." />
          </div>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<Loading variant="inline" tip="Đang tải dữ liệu..." />
<Loading variant="inline" fullHeight />`}
          </pre>
        </Space>
      </Card>

      {/* Example 3: Card */}
      <Card title="3. Card Loading" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph>Loading trong card container.</Paragraph>
          <Card>
            <Loading variant="card" size="large" tip="Đang tải..." />
          </Card>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<Loading variant="card" size="large" tip="Đang tải..." />`}
          </pre>
        </Space>
      </Card>

      {/* Example 4: Skeleton */}
      <Card title="4. Skeleton Loading" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph>Skeleton loading với placeholder.</Paragraph>
          <SkeletonLoading skeletonRows={5} />
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<Loading variant="skeleton" skeletonRows={5} />`}
          </pre>
        </Space>
      </Card>

      {/* Example 5: Full Page */}
      <Card title="5. Full Page Loading" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Paragraph>
            Full page loading (thường dùng cho page transitions).
            <Text type="warning"> Lưu ý: Không demo được ở đây vì sẽ che toàn màn hình.</Text>
          </Paragraph>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`<Loading variant="fullPage" size="large" tip="Đang tải trang..." />`}
          </pre>
        </Space>
      </Card>

      {/* Usage in Code */}
      <Card title="📝 Cách sử dụng trong code">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Text strong>Import:</Text>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`import Loading from "@/components/common/Loading";
// hoặc
import { FullPageLoading, InlineLoading } from "@/components/common/Loading";`}
          </pre>

          <Text strong>Ví dụ với state:</Text>
          <pre style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4 }}>
{`function MyComponent() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <Loading variant="card" size="large" />;
  }

  return <div>Content</div>;
}`}
          </pre>
        </Space>
      </Card>
    </div>
  );
}

