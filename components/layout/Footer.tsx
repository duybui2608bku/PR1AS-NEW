"use client";

import { Layout, Row, Col, Space, Divider } from "antd";
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const { Footer: AntFooter } = Layout;

export default function Footer() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  return (
    <AntFooter
      style={{
        backgroundColor: "#f7f7f7",
        borderTop: "1px solid #e4e4e4",
        marginTop: "48px",
      }}
    >
      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 16px" }}
        className="sm:p-12"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6}>
            <div
              style={{
                marginBottom: "16px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {t("footer.about.title")}
            </div>
            <Space direction="vertical" size="small">
              <Link href="/about" style={{ color: "#717171" }}>
                {t("footer.about.aboutUs")}
              </Link>
              <Link href="/careers" style={{ color: "#717171" }}>
                {t("footer.about.careers")}
              </Link>
              <Link href="/press" style={{ color: "#717171" }}>
                {t("footer.about.press")}
              </Link>
              <Link href="/blog" style={{ color: "#717171" }}>
                {t("footer.about.blog")}
              </Link>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div
              style={{
                marginBottom: "16px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {t("footer.community.title")}
            </div>
            <Space direction="vertical" size="small">
              <Link href="/diversity" style={{ color: "#717171" }}>
                {t("footer.community.diversity")}
              </Link>
              <Link href="/accessibility" style={{ color: "#717171" }}>
                {t("footer.community.accessibility")}
              </Link>
              <Link href="/partners" style={{ color: "#717171" }}>
                {t("footer.community.partners")}
              </Link>
              <Link href="/safety" style={{ color: "#717171" }}>
                {t("footer.community.safety")}
              </Link>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div
              style={{
                marginBottom: "16px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {t("footer.worker.title")}
            </div>
            <Space direction="vertical" size="small">
              <Link href="/become-worker" style={{ color: "#717171" }}>
                {t("footer.worker.become")}
              </Link>
              <Link href="/worker-help" style={{ color: "#717171" }}>
                {t("footer.worker.help")}
              </Link>
              <Link href="/worker-resources" style={{ color: "#717171" }}>
                {t("footer.worker.resources")}
              </Link>
              <Link href="/community-forum" style={{ color: "#717171" }}>
                {t("footer.worker.forum")}
              </Link>
            </Space>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <div
              style={{
                marginBottom: "16px",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {t("footer.support.title")}
            </div>
            <Space direction="vertical" size="small">
              <Link href="/help" style={{ color: "#717171" }}>
                {t("footer.support.helpCenter")}
              </Link>
              <Link href="/cancellation" style={{ color: "#717171" }}>
                {t("footer.support.cancellation")}
              </Link>
              <Link href="/contact" style={{ color: "#717171" }}>
                {t("footer.support.contact")}
              </Link>
              <Link href="/faq" style={{ color: "#717171" }}>
                {t("footer.support.faq")}
              </Link>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "24px 0" }} className="sm:my-8" />

        {/* Company Info Section */}
        {settings?.footerCompanyName && (
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <div
                style={{
                  marginBottom: 8,
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {settings.footerCompanyName}
              </div>
              {settings.footerAbout && (
                <div
                  style={{
                    color: "#717171",
                    fontSize: "14px",
                    marginBottom: 8,
                  }}
                >
                  {settings.footerAbout}
                </div>
              )}
              <Space
                direction="vertical"
                size="small"
                style={{ fontSize: "14px", color: "#717171" }}
              >
                {settings.footerAddress && (
                  <div>📍 {settings.footerAddress}</div>
                )}
                {settings.footerPhone && (
                  <div>
                    <a
                      href={`tel:${settings.footerPhone}`}
                      style={{ color: "#717171" }}
                    >
                      📞 {settings.footerPhone}
                    </a>
                  </div>
                )}
                {settings.footerEmail && (
                  <div>
                    <a
                      href={`mailto:${settings.footerEmail}`}
                      style={{ color: "#717171" }}
                    >
                      ✉️ {settings.footerEmail}
                    </a>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        )}

        <Divider style={{ margin: "24px 0" }} className="sm:my-8" />

        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={12} style={{ marginBottom: "16px" }}>
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start text-xs sm:text-sm text-gray-500">
              <span>{settings?.footerCopyright || t("footer.copyright")}</span>
              <Link href="/terms" style={{ color: "#717171" }}>
                {t("footer.terms")}
              </Link>
              <Link href="/privacy" style={{ color: "#717171" }}>
                {t("footer.privacy")}
              </Link>
              <Link href="/sitemap" style={{ color: "#717171" }}>
                {t("footer.sitemap")}
              </Link>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="flex gap-4 sm:gap-6 justify-center md:justify-end">
              {settings?.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FacebookOutlined
                    style={{
                      fontSize: "20px",
                      color: "#717171",
                      cursor: "pointer",
                    }}
                  />
                </a>
              )}
              {settings?.twitterUrl && (
                <a
                  href={settings.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <TwitterOutlined
                    style={{
                      fontSize: "20px",
                      color: "#717171",
                      cursor: "pointer",
                    }}
                  />
                </a>
              )}
              {settings?.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <InstagramOutlined
                    style={{
                      fontSize: "20px",
                      color: "#717171",
                      cursor: "pointer",
                    }}
                  />
                </a>
              )}
              {settings?.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <LinkedinOutlined
                    style={{
                      fontSize: "20px",
                      color: "#717171",
                      cursor: "pointer",
                    }}
                  />
                </a>
              )}
            </div>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
}
