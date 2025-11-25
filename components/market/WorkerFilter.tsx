/**
 * Worker Filter Component
 * Sidebar filter for worker marketplace
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Form,
  Select,
  Slider,
  InputNumber,
  Button,
  Space,
  Divider,
  Typography,
  Row,
  Col,
} from "antd";
import {
  FilterOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { WorkerFilters } from "@/lib/market/types";
import { ServiceCategory, Service } from "@/lib/worker/types";

const { Title, Text } = Typography;
const { Option } = Select;

interface WorkerFilterProps {
  onFilterChange: (filters: WorkerFilters) => void;
  categories: ServiceCategory[];
  services: Service[];
  loading?: boolean;
}

export default function WorkerFilter({
  onFilterChange,
  categories,
  services,
  loading = false,
}: WorkerFilterProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  // State for filters
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedService, setSelectedService] = useState<string | undefined>();

  // Filter services by selected category
  const filteredServices = useMemo(
    () =>
      selectedCategory
        ? services.filter((s) => s.category_id === selectedCategory)
        : services,
    [selectedCategory, services]
  );

  // Handle filter submission
  const handleApplyFilters = useCallback(() => {
    const filters: WorkerFilters = {
      age_min: ageRange[0],
      age_max: ageRange[1],
      price_min: priceRange[0],
      price_max: priceRange[1],
      category_id: selectedCategory,
      service_id: selectedService,
    };

    onFilterChange(filters);
  }, [ageRange, priceRange, selectedCategory, selectedService, onFilterChange]);

  // Handle reset
  const handleReset = useCallback(() => {
    setAgeRange([18, 60]);
    setPriceRange([0, 200]);
    setSelectedCategory(undefined);
    setSelectedService(undefined);
    form.resetFields();
    onFilterChange({});
  }, [form, onFilterChange]);

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: string) => {
      setSelectedCategory(value);
      setSelectedService(undefined);
      form.setFieldValue("service_id", undefined);
    },
    [form]
  );

  return (
    <Card
      className="sticky top-4 shadow-lg"
      title={
        <Space>
          <FilterOutlined />
          <Title level={4} className="m-0">
            {t("market.filters")}
          </Title>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleApplyFilters}>
        {/* Age Range */}
        <Form.Item label={<Text strong>{t("market.ageRange")}</Text>}>
          <Slider
            range
            min={18}
            max={60}
            value={ageRange}
            onChange={(value) => setAgeRange(value as [number, number])}
            marks={{
              18: "18",
              30: "30",
              45: "45",
              60: "60",
            }}
            tooltip={{
              formatter: (value) => `${value} ${t("market.years")}`,
            }}
          />
          <Row gutter={16} className="mt-3">
            <Col span={12}>
              <InputNumber
                min={18}
                max={60}
                value={ageRange[0]}
                onChange={(value) => setAgeRange([value || 18, ageRange[1]])}
                addonBefore={t("market.min")}
                className="w-full"
              />
            </Col>
            <Col span={12}>
              <InputNumber
                min={18}
                max={60}
                value={ageRange[1]}
                onChange={(value) => setAgeRange([ageRange[0], value || 60])}
                addonBefore={t("market.max")}
                className="w-full"
              />
            </Col>
          </Row>
        </Form.Item>

        <Divider />

        {/* Service Category */}
        <Form.Item
          name="category_id"
          label={<Text strong>{t("market.category")}</Text>}
        >
          <Select
            placeholder={t("market.selectCategory")}
            allowClear
            onChange={handleCategoryChange}
            value={selectedCategory}
            size="large"
          >
            {categories.map((category) => (
              <Option key={category.id} value={category.id}>
                {t(category.name_key)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Service */}
        <Form.Item
          name="service_id"
          label={<Text strong>{t("market.service")}</Text>}
        >
          <Select
            placeholder={t("market.selectService")}
            allowClear
            disabled={!selectedCategory}
            onChange={setSelectedService}
            value={selectedService}
            size="large"
          >
            {filteredServices.map((service) => (
              <Option key={service.id} value={service.id}>
                {t(service.name_key)}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        {/* Price Range */}
        <Form.Item label={<Text strong>{t("market.priceRange")}</Text>}>
          <Slider
            range
            min={0}
            max={200}
            step={5}
            value={priceRange}
            onChange={(value) => setPriceRange(value as [number, number])}
            marks={{
              0: "$0",
              50: "$50",
              100: "$100",
              150: "$150",
              200: "$200+",
            }}
            tooltip={{
              formatter: (value) => `$${value}/hr`,
            }}
          />
          <Row gutter={16} className="mt-3">
            <Col span={12}>
              <InputNumber
                min={0}
                max={200}
                value={priceRange[0]}
                onChange={(value) =>
                  setPriceRange([value || 0, priceRange[1]])
                }
                addonBefore="$"
                addonAfter="/hr"
                className="w-full"
              />
            </Col>
            <Col span={12}>
              <InputNumber
                min={0}
                max={200}
                value={priceRange[1]}
                onChange={(value) =>
                  setPriceRange([priceRange[0], value || 200])
                }
                addonBefore="$"
                addonAfter="/hr"
                className="w-full"
              />
            </Col>
          </Row>
        </Form.Item>

        <Divider />

        {/* Action Buttons */}
        <Space direction="vertical" className="w-full" size="middle">
          <Button
            type="primary"
            htmlType="submit"
            icon={<SearchOutlined />}
            size="large"
            block
            loading={loading}
            className="font-semibold"
          >
            {t("market.applyFilters")}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            size="large"
            block
            onClick={handleReset}
          >
            {t("market.resetFilters")}
          </Button>
        </Space>
      </Form>
    </Card>
  );
}
