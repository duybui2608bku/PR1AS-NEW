"use client";

import { memo } from "react";
import { Card, Typography, Space, Tag, Descriptions } from "antd";
import { useTranslation } from "react-i18next";
import { ServiceWithPrice } from "@/lib/worker/types";
import { Currency } from "@/lib/utils/enums";

const { Text } = Typography;

interface PublicServiceCardProps {
  service: ServiceWithPrice;
  displayCurrency: Currency;
  direction?: "horizontal" | "vertical";
}

// Currency conversion function
function convertAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;

  const rates: Record<Currency, number> = {
    [Currency.USD]: 1,
    [Currency.VND]: 24000,
    [Currency.JPY]: 150,
    [Currency.KRW]: 1300,
    [Currency.CNY]: 7,
  };

  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;

  return (amount * toRate) / fromRate;
}

// Format currency function
function formatCurrencyClient(amount: number, currency: string) {
  // Special handling for VND: show millions with "M" suffix
  if (currency === Currency.VND && amount >= 1000000) {
    const millions = amount / 1000000;
    // Format to 1 decimal place if needed, otherwise show as integer
    const formatted =
      millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${formatted}M`;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

const PublicServiceCard = memo(function PublicServiceCard({
  service,
  displayCurrency,
  direction = "vertical",
}: PublicServiceCardProps) {
  const { t } = useTranslation();

  const pricing = service.pricing;
  const priceTiers = service.price_tiers;

  if (!pricing || !priceTiers) {
    return null;
  }

  // Validate and convert prices to display currency
  const hourlyConverted =
    priceTiers.hourly != null && !isNaN(priceTiers.hourly)
      ? convertAmount(priceTiers.hourly, priceTiers.currency, displayCurrency)
      : 0;
  const dailyConverted =
    priceTiers.daily != null && !isNaN(priceTiers.daily)
      ? convertAmount(priceTiers.daily, priceTiers.currency, displayCurrency)
      : 0;
  const weeklyConverted =
    priceTiers.weekly != null && !isNaN(priceTiers.weekly)
      ? convertAmount(priceTiers.weekly, priceTiers.currency, displayCurrency)
      : 0;
  const monthlyConverted =
    priceTiers.monthly != null && !isNaN(priceTiers.monthly)
      ? convertAmount(priceTiers.monthly, priceTiers.currency, displayCurrency)
      : 0;

  return (
    <Card
      size="small"
      title={
        <Space direction={direction}>
          <Text strong>{t(`services.${service.name_key}`)}</Text>
          {service.worker_service?.service_option_id && (
            <Tag color="blue">
              {t(
                `services.options.${service.worker_service.service_option?.option_key}`
              )}
            </Tag>
          )}
        </Space>
      }
    >
      <Descriptions column={direction === "horizontal" ? 4 : 1} size="small">
        <Descriptions.Item label={t("worker.profile.hourly")}>
          <Text strong>
            {formatCurrencyClient(hourlyConverted, displayCurrency)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label={t("worker.profile.daily")}>
          <Text>{formatCurrencyClient(dailyConverted, displayCurrency)}</Text>
          {pricing.daily_discount_percent > 0 && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              -{pricing.daily_discount_percent}%
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("worker.profile.weekly")}>
          <Text>{formatCurrencyClient(weeklyConverted, displayCurrency)}</Text>
          {pricing.weekly_discount_percent > 0 && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              -{pricing.weekly_discount_percent}%
            </Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("worker.profile.monthly")}>
          <Text>{formatCurrencyClient(monthlyConverted, displayCurrency)}</Text>
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
