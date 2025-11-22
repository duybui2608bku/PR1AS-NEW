"use client";

import { Card, Typography, Space, Button, Tag, Descriptions, Popconfirm } from "antd";
import { DeleteOutlined, DollarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { ServiceWithPrice } from "@/lib/worker/types";
import { formatCurrency } from "@/lib/worker/api-client";

const { Text, Title } = Typography;

interface ServiceCardProps {
  service: ServiceWithPrice;
  onRemove: () => void;
}

export default function ServiceCard({ service, onRemove }: ServiceCardProps) {
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
      extra={
        <Popconfirm
          title={t("worker.profile.confirmRemoveService")}
          onConfirm={onRemove}
          okText={t("common.yes")}
          cancelText={t("common.no")}
        >
          <Button type="text" danger icon={<DeleteOutlined />}>
            {t("common.remove")}
          </Button>
        </Popconfirm>
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
}
