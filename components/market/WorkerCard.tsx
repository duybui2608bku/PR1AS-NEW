/**
 * Worker Card Component
 * Displays a worker profile card in the marketplace
 */

"use client";

import { Card, Tag, Typography, Space, Button, Avatar } from "antd";
import {
  UserOutlined,
  DollarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { WorkerMarketProfile } from "@/lib/market/types";
import Link from "next/link";

const { Text, Paragraph, Title } = Typography;

interface WorkerCardProps {
  worker: WorkerMarketProfile;
}

export default function WorkerCard({ worker }: WorkerCardProps) {
  const { t } = useTranslation();

  // Get display name
  const displayName = worker.nickname || worker.full_name;

  // Get avatar URL
  const avatarUrl = worker.avatar?.image_url;

  // Calculate price range
  const priceRange =
    worker.min_price && worker.max_price
      ? worker.min_price === worker.max_price
        ? `$${worker.min_price}/hr`
        : `$${worker.min_price} - $${worker.max_price}/hr`
      : t("market.priceNotSet");

  // Get top 3 services
  const topServices = worker.services?.slice(0, 3) || [];

  return (
    <Card
      hoverable
      className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl"
      cover={
        <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <UserOutlined className="text-6xl text-gray-400" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Tag color="green" className="text-xs font-semibold">
              {t("market.available")}
            </Tag>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-3">
          <Title level={4} className="mb-1">
            {displayName}
          </Title>
          <Space size="small" className="text-gray-500">
            <UserOutlined />
            <Text type="secondary">
              {worker.age} {t("market.yearsOld")}
            </Text>
          </Space>
        </div>

        {/* Bio */}
        {worker.bio && (
          <Paragraph
            ellipsis={{ rows: 2 }}
            className="text-gray-600 mb-3 flex-grow"
          >
            {worker.bio}
          </Paragraph>
        )}

        {/* Services */}
        <div className="mb-3">
          <Text className="text-xs text-gray-500 block mb-2">
            {t("market.services")}:
          </Text>
          <Space size={[0, 8]} wrap>
            {topServices.map((service) => (
              <Tag
                key={service.id}
                color="blue"
                className="text-xs"
              >
                {t(service.service.name_key)}
              </Tag>
            ))}
            {worker.services && worker.services.length > 3 && (
              <Tag className="text-xs">
                +{worker.services.length - 3} {t("market.more")}
              </Tag>
            )}
          </Space>
        </div>

        {/* Price */}
        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <Space>
            <DollarOutlined className="text-green-600" />
            <Text strong className="text-green-700">
              {priceRange}
            </Text>
          </Space>
        </div>

        {/* Action Button */}
        <Link href={`/worker/profile/${worker.id}`} className="w-full">
          <Button type="primary" block size="large" className="font-semibold">
            {t("market.viewProfile")}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
