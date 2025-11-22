"use client";

import { Button, Typography, Result } from "antd";
import { StopOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Paragraph } = Typography;

export default function BannedPage() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        padding: "24px",
      }}
    >
      <Result
        status="error"
        icon={<StopOutlined style={{ color: "#ff4d4f" }} />}
        title={t("banned.title")}
        subTitle={
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <Paragraph>{t("banned.description")}</Paragraph>
            <Paragraph>{t("banned.reason")}</Paragraph>
            <Paragraph type="secondary" style={{ marginTop: "24px" }}>
              {t("banned.contact")}
            </Paragraph>
          </div>
        }
        extra={
          <Button type="primary" size="large" href="mailto:support@pr1as.com">
            {t("banned.contactButton")}
          </Button>
        }
      />
    </div>
  );
}
