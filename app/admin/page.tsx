"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Typography, DatePicker, Space, Button } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs, { type Dayjs } from "dayjs";
import { adminStatsAPI, type AdminDashboardStats } from "@/lib/admin/stats-api";
import Loading from "@/components/common/Loading";
import { showNotification } from "@/lib/utils/toast";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    activeWorkers: 0,
    totalJobs: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const dateFrom = dateRange?.[0]?.format("YYYY-MM-DD");
      const dateTo = dateRange?.[1]?.format("YYYY-MM-DD");
      const data = await adminStatsAPI.getStats(dateFrom, dateTo);
      setStats(data);
    } catch (error: any) {
      showNotification.error(
        "Error loading statistics",
        error.message || "Failed to fetch dashboard statistics"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [dateRange]);

  if (loading && stats.totalUsers === 0 && stats.activeWorkers === 0) {
    return <Loading variant="card" size="large" tip={t("common.loading")} />;
  }

  return (
    <div>
      <Space style={{ marginBottom: 24, width: "100%", justifyContent: "space-between" }}>
        <Title level={2} style={{ margin: 0 }}>
          {t("admin.dashboard.title")}
        </Title>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates)}
            format="YYYY-MM-DD"
            allowClear
            placeholder={["Start Date", "End Date"]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
            {t("common.refresh") || "Refresh"}
          </Button>
        </Space>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.totalUsers")}
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.activeWorkers")}
              value={stats.activeWorkers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.totalJobs")}
              value={stats.totalJobs}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#cf1322" }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.revenue")}
              value={stats.revenue}
              prefix={<DollarOutlined />}
              precision={2}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
