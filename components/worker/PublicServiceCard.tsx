"use client";

import { memo } from "react";
import { Card, Typography, Space, Tag, Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { ServiceWithPrice } from "@/lib/worker/types";
import { formatCurrency } from "@/lib/worker/api-client";

const { Text } = Typography;

interface PublicServiceCardProps {
  service: ServiceWithPrice;
}

const PublicServiceCard = memo(function PublicServiceCard({ service }: PublicServiceCardProps) {
  const { t } = useTranslation();

  const pricing = service.pricing;
  const priceTiers = service.price_tiers;

  if (!pricing || !priceTiers) {
    return null;
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <Text strong>{t(`services.${service.name_key}`)}</Text>
          {service.worker_service?.service_option_id && (
            <Tag color="blue">
              {t(`services.options.${service.worker_service.service_option?.option_key}`)}
            </Tag>
          )}
        </Space>
      }
    >
      <Descriptions column={4} size="small">
        <Descriptions.Item label={t("worker.profile.hourly")}>
          <Text strong>{formatCurrency(priceTiers.hourly, pricing.primary_currency)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t("worker.profile.daily")}>
          <Text>{formatCurrency(priceTiers.daily, pricing.primary_currency)}</Text>
          {pricing.daily_discount_percent > 0 && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              -{pricing.daily_discount_percent}%
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("worker.profile.weekly")}>
          <Text>{formatCurrency(priceTiers.weekly, pricing.primary_currency)}</Text>
          {pricing.weekly_discount_percent > 0 && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              -{pricing.weekly_discount_percent}%
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("worker.profile.monthly")}>
          <Text>{formatCurrency(priceTiers.monthly, pricing.primary_currency)}</Text>
          {pricing.monthly_discount_percent > 0 && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              -{pricing.monthly_discount_percent}%
            </Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
});

export default PublicServiceCard;
