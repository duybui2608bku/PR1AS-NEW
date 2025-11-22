"use client";

import { memo } from "react";
import { Typography, Row, Col } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

const HowItWorksSection = memo(function HowItWorksSection() {
  const { t } = useTranslation();

  const STEPS = [
    {
      id: "step1",
      number: "01",
      titleKey: "home.howItWorks.steps.step1.title",
      descriptionKey: "home.howItWorks.steps.step1.description",
    },
    {
      id: "step2",
      number: "02",
      titleKey: "home.howItWorks.steps.step2.title",
      descriptionKey: "home.howItWorks.steps.step2.description",
    },
    {
      id: "step3",
      number: "03",
      titleKey: "home.howItWorks.steps.step3.title",
      descriptionKey: "home.howItWorks.steps.step3.description",
    },
    {
      id: "step4",
      number: "04",
      titleKey: "home.howItWorks.steps.step4.title",
      descriptionKey: "home.howItWorks.steps.step4.description",
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
            {t("home.howItWorks.title")}
          </Title>
          <Paragraph className="!text-base sm:!text-lg md:!text-xl !text-gray-600 max-w-2xl mx-auto px-4">
            {t("home.howItWorks.subtitle")}
          </Paragraph>
        </div>

        <Row gutter={[16, 32]}>
          {STEPS.map((step, index) => (
            <Col xs={24} sm={12} md={6} key={step.id}>
              <div className="relative text-center px-2">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#690F0F] to-[#8B1818] rounded-full mb-4 sm:mb-6 relative z-10">
                  <span className="text-3xl sm:text-4xl font-bold text-white">
                    {step.number}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 sm:top-12 left-1/2 w-full h-1 bg-gradient-to-r from-[#690F0F] to-[#8B1818] opacity-30"></div>
                )}
                <Title
                  level={4}
                  className="!text-lg sm:!text-xl !mb-2 sm:!mb-3"
                >
                  {t(step.titleKey)}
                </Title>
                <Paragraph className="!text-gray-600 !text-sm sm:!text-base">
                  {t(step.descriptionKey)}
                </Paragraph>
              </div>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-8 sm:mt-12">
          <CheckCircleOutlined className="text-5xl sm:text-6xl text-green-500 mb-3 sm:mb-4" />
          <Title level={4} className="!text-xl sm:!text-2xl !text-gray-700">
            {t("home.howItWorks.finalText")}
          </Title>
        </div>
      </div>
    </section>
  );
});

export default HowItWorksSection;
