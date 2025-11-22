"use client";

import { Typography, Button, Row, Col } from "antd";
import { UserOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

export default function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-[#690F0F] to-[#8B1818] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Title
          level={2}
          className="!text-white !text-3xl sm:!text-4xl md:!text-5xl !font-bold !mb-4 sm:!mb-6"
        >
          {t("home.cta.title")}
        </Title>
        <Paragraph className="!text-white !text-base sm:!text-lg md:!text-xl !mb-6 sm:!mb-8 opacity-90 px-4">
          {t("home.cta.subtitle")}
        </Paragraph>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
          <Link href="/auth/signup" className="w-full sm:w-auto">
            <Button
              type="primary"
              size="large"
              icon={<UserOutlined />}
              className="!h-12 sm:!h-14 !px-8 sm:!px-10 !text-base sm:!text-lg !font-semibold !bg-white !text-[#690F0F] hover:!bg-gray-100 w-full sm:w-auto"
            >
              {t("home.cta.primaryButton")}
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full sm:w-auto">
            <Button
              size="large"
              className="!h-12 sm:!h-14 !px-8 sm:!px-10 !text-base sm:!text-lg !font-semibold !bg-transparent !text-white !border-white hover:!bg-white/10 w-full sm:w-auto"
            >
              {t("home.cta.secondaryButton")}
            </Button>
          </Link>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/20">
          <Row
            gutter={[12, 12]}
            justify="center"
            className="text-xs sm:text-sm opacity-80"
          >
            <Col xs={24} sm={8}>
              <CheckCircleOutlined /> {t("home.cta.benefits.free")}
            </Col>
            <Col xs={24} sm={8}>
              <CheckCircleOutlined /> {t("home.cta.benefits.noCard")}
            </Col>
            <Col xs={24} sm={8}>
              <CheckCircleOutlined /> {t("home.cta.benefits.cancel")}
            </Col>
          </Row>
        </div>
      </div>
    </section>
  );
}
