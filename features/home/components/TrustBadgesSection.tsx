"use client";

import { memo } from "react";
import { Typography, Row, Col } from "antd";
import {
  TrophyOutlined,
  SafetyOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Text } = Typography;

const TrustBadgesSection = memo(function TrustBadgesSection() {
  const { t } = useTranslation();

  const badges = [
    {
      id: "award",
      icon: TrophyOutlined,
      titleKey: "home.trustBadges.award.title",
      descriptionKey: "home.trustBadges.award.description",
      color: "text-yellow-500",
    },
    {
      id: "security",
      icon: SafetyOutlined,
      titleKey: "home.trustBadges.security.title",
      descriptionKey: "home.trustBadges.security.description",
      color: "text-green-500",
    },
    {
      id: "community",
      icon: TeamOutlined,
      titleKey: "home.trustBadges.community.title",
      descriptionKey: "home.trustBadges.community.description",
      color: "text-blue-500",
    },
  ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Row gutter={[16, 24]} align="middle">
          {badges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <Col xs={24} sm={8} md={8} className="text-center" key={badge.id}>
                <IconComponent
                  className={`text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 ${badge.color}`}
                />
                <Title
                  level={4}
                  className="!mb-1 sm:!mb-2 !text-base sm:!text-lg md:!text-xl"
                >
                  {t(badge.titleKey)}
                </Title>
                <Text className="!text-gray-600 !text-sm sm:!text-base">
                  {t(badge.descriptionKey)}
                </Text>
              </Col>
            );
          })}
        </Row>
      </div>
    </section>
  );
});

export default TrustBadgesSection;
