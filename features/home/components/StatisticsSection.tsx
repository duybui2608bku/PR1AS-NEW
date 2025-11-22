"use client";

import { memo } from "react";
import { Row, Col, Statistic } from "antd";
import { useTranslation } from "react-i18next";

const StatisticsSection = memo(function StatisticsSection() {
  const { t } = useTranslation();

  const STATISTICS = [
    { titleKey: "home.statistics.workers", value: 12500, suffix: "+" },
    { titleKey: "home.statistics.jobs", value: 50000, suffix: "+" },
    { titleKey: "home.statistics.clients", value: 25000, suffix: "+" },
    { titleKey: "home.statistics.rating", value: 4.9, suffix: "/5.0" },
  ];

  return (
    <section className="py-8 sm:py-12 bg-gray-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Row gutter={[16, 24]} justify="center">
          {STATISTICS.map((stat) => (
            <Col xs={12} sm={6} md={6} key={stat.titleKey}>
              <div className="text-center">
                <Statistic
                  title={t(stat.titleKey)}
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{
                    color: "#690F0F",
                    fontWeight: "bold",
                    fontSize: "clamp(1.25rem, 4vw, 2rem)",
                  }}
                  className="statistic-responsive"
                />
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
});

export default StatisticsSection;
