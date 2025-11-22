"use client";

import { Typography, Row, Col, Card } from "antd";
import {
  SafetyOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

export default function FeaturesSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <SafetyOutlined className="text-4xl text-[#690F0F]" />,
      title: t("home.features.safety.title"),
      description: t("home.features.safety.description"),
      colorClass: "purple",
    },
    {
      icon: <ThunderboltOutlined className="text-4xl text-[#690F0F]" />,
      title: t("home.features.speed.title"),
      description: t("home.features.speed.description"),
      colorClass: "pink",
    },
    {
      icon: <StarOutlined className="text-4xl text-[#690F0F]" />,
      title: t("home.features.quality.title"),
      description: t("home.features.quality.description"),
      colorClass: "red",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <Title
            level={2}
            className="!text-3xl sm:!text-4xl md:!text-5xl !font-bold !mb-3 sm:!mb-4"
          >
            {t("home.features.title")}
          </Title>
          <Paragraph className="!text-base sm:!text-lg md:!text-xl !text-gray-600 max-w-2xl mx-auto px-4">
            {t("home.features.subtitle")}
          </Paragraph>
        </div>

        <Row gutter={[16, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={24} md={8} key={index}>
              <Card
                hoverable
                className={`!h-full !border-2 hover:!border-[#690F0F] !transition-all !duration-300 hover:!shadow-xl`}
              >
                <div className="text-center p-2 sm:p-4">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-[#fef2f2] rounded-full mb-4 sm:mb-6`}
                  >
                    {feature.icon}
                  </div>
                  <Title
                    level={3}
                    className="!text-xl sm:!text-2xl !mb-3 sm:!mb-4"
                  >
                    {feature.title}
                  </Title>
                  <Paragraph className="!text-gray-600 !text-sm sm:!text-base">
                    {feature.description}
                  </Paragraph>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
