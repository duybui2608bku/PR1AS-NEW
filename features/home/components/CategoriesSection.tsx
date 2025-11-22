"use client";

import { Typography, Row, Col, Card, Button } from "antd";
import Link from "next/link";
import {
  HomeOutlined,
  ToolOutlined,
  CarOutlined,
  ShoppingOutlined,
  UserOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title, Paragraph, Text } = Typography;

export default function CategoriesSection() {
  const { t } = useTranslation();

  const CATEGORIES = [
    { icon: <HomeOutlined />, nameKey: "home.categories.items.homeRepair.name", countKey: "home.categories.items.homeRepair.count" },
    { icon: <ToolOutlined />, nameKey: "home.categories.items.electricity.name", countKey: "home.categories.items.electricity.count" },
    { icon: <CarOutlined />, nameKey: "home.categories.items.transport.name", countKey: "home.categories.items.transport.count" },
    { icon: <ShoppingOutlined />, nameKey: "home.categories.items.housekeeping.name", countKey: "home.categories.items.housekeeping.count" },
    { icon: <UserOutlined />, nameKey: "home.categories.items.care.name", countKey: "home.categories.items.care.count" },
    { icon: <TeamOutlined />, nameKey: "home.categories.items.events.name", countKey: "home.categories.items.events.count" },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <Title
            level={2}
            className="!text-3xl sm:!text-4xl md:!text-5xl !font-bold !mb-3 sm:!mb-4"
          >
            {t("home.categories.title")}
          </Title>
          <Paragraph className="!text-base sm:!text-lg md:!text-xl !text-gray-600 max-w-2xl mx-auto px-4">
            {t("home.categories.subtitle")}
          </Paragraph>
        </div>

        <Row gutter={[12, 16]}>
          {CATEGORIES.map((category, index) => (
            <Col xs={12} sm={8} md={6} lg={4} key={index}>
              <Card
                hoverable
                className="!text-center !border-2 hover:!border-[#690F0F] !transition-all !duration-300 hover:!shadow-lg hover:!-translate-y-1"
              >
                <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-4 text-[#690F0F]">
                  {category.icon}
                </div>
                <Title
                  level={5}
                  className="!mb-1 sm:!mb-2 !text-xs sm:!text-sm md:!text-base"
                >
                  {t(category.nameKey)}
                </Title>
                <Text type="secondary" className="!text-xs sm:!text-sm">
                  {t(category.countKey)}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center mt-8 sm:mt-12">
          <Link href="/auth/signup">
            <Button
              type="primary"
              size="large"
              className="!h-11 sm:!h-12 !px-6 sm:!px-8 !text-sm sm:!text-base !font-semibold"
            >
              {t("home.categories.viewAll")}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
