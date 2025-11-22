/**
 * Market Worker Page
 * Public marketplace for browsing available workers
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Input,
  Pagination,
  Empty,
  Spin,
  Typography,
  Space,
  Button,
  Drawer,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { marketAPI } from "@/lib/market/api-client";
import { WorkerMarketProfile, WorkerFilters } from "@/lib/market/types";
import { ServiceCategory, Service } from "@/lib/worker/types";
import WorkerCard from "@/components/market/WorkerCard";
import WorkerFilter from "@/components/market/WorkerFilter";
import { WorkerProfileService } from "@/lib/worker/service";
import { createClient } from "@/lib/supabase/client";
import Loading from "@/components/common/Loading";

const { Title, Text } = Typography;
const { Search } = Input;

export default function MarketPage() {
  const { t } = useTranslation();

  // State
  const [workers, setWorkers] = useState<WorkerMarketProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState<WorkerFilters>({
    page: 1,
    limit: 12,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    total_pages: 0,
  });
  const [mobileFilterVisible, setMobileFilterVisible] = useState(false);

  // Load categories and services
  useEffect(() => {
    const loadCategoriesAndServices = async () => {
      try {
        const supabase = createClient();
        const workerService = new WorkerProfileService(supabase);

        const [categoriesData, servicesData] = await Promise.all([
          workerService.getServiceCategories(),
          workerService.getServices(),
        ]);

        setCategories(categoriesData);
        setServices(servicesData);
      } catch (error) {
        console.error("Failed to load categories and services:", error);
      }
    };

    loadCategoriesAndServices();
  }, []);

  // Load workers
  const loadWorkers = useCallback(async () => {
    try {
      setSearchLoading(true);
      const response = await marketAPI.getWorkers(filters);
      setWorkers(response.workers);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to load workers:", error);
      setWorkers([]);
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  // Handle filter change
  const handleFilterChange = (newFilters: WorkerFilters) => {
    setFilters({
      ...newFilters,
      page: 1,
      limit: 12,
    });
    setMobileFilterVisible(false);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setFilters({
      ...filters,
      search: value || undefined,
      page: 1,
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      page,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Space direction="vertical" className="w-full" size="large">
            <div>
              <Title level={1} className="mb-2">
                {t("market.title")}
              </Title>
              <Text className="text-lg text-gray-600">
                {t("market.subtitle")}
              </Text>
            </div>

            {/* Search Bar */}
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={24} md={18}>
                <Search
                  placeholder={t("market.searchPlaceholder")}
                  allowClear
                  enterButton={
                    <Button type="primary" icon={<SearchOutlined />}>
                      {t("market.search")}
                    </Button>
                  }
                  size="large"
                  onSearch={handleSearch}
                  loading={searchLoading}
                />
              </Col>
              <Col xs={24} sm={24} md={6}>
                <Button
                  type="default"
                  icon={<FilterOutlined />}
                  size="large"
                  block
                  className="md:hidden"
                  onClick={() => setMobileFilterVisible(true)}
                >
                  {t("market.filters")}
                </Button>
              </Col>
            </Row>

            {/* Results Count */}
            <Text className="text-gray-600">
              {t("market.resultsCount", { count: pagination.total })}
            </Text>
          </Space>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Row gutter={[24, 24]}>
          {/* Desktop Filter Sidebar */}
          <Col xs={0} sm={0} md={6} lg={6}>
            <WorkerFilter
              onFilterChange={handleFilterChange}
              categories={categories}
              services={services}
              loading={searchLoading}
            />
          </Col>

          {/* Workers Grid */}
          <Col xs={24} sm={24} md={18} lg={18}>
            <Spin spinning={searchLoading}>
              {workers.length === 0 ? (
                <Empty
                  description={t("market.noWorkers")}
                  className="py-16"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <>
                  <Row gutter={[16, 16]}>
                    {workers.map((worker) => (
                      <Col
                        key={worker.id}
                        xs={24}
                        sm={12}
                        md={12}
                        lg={8}
                        xl={8}
                      >
                        <WorkerCard worker={worker} />
                      </Col>
                    ))}
                  </Row>

                  {/* Pagination */}
                  {pagination.total_pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <Pagination
                        current={pagination.page}
                        total={pagination.total}
                        pageSize={pagination.limit}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showTotal={(total, range) =>
                          t("market.pagination", {
                            start: range[0],
                            end: range[1],
                            total,
                          })
                        }
                      />
                    </div>
                  )}
                </>
              )}
            </Spin>
          </Col>
        </Row>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        title={
          <Space>
            <FilterOutlined />
            <Text strong>{t("market.filters")}</Text>
          </Space>
        }
        placement="right"
        onClose={() => setMobileFilterVisible(false)}
        open={mobileFilterVisible}
        width="85%"
        closeIcon={<CloseOutlined />}
      >
        <WorkerFilter
          onFilterChange={handleFilterChange}
          categories={categories}
          services={services}
          loading={searchLoading}
        />
      </Drawer>
    </div>
  );
}
