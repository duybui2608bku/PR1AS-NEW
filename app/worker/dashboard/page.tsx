"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  DatePicker,
  Space,
  Spin,
  message,
} from "antd";
import {
  FileTextOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs, { Dayjs } from "dayjs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface DashboardStats {
  availableJobs: number;
  inProgress: number;
  completed: number;
  totalEarnings: number;
}

interface ChartData {
  earnings: Array<{ date: string; earnings: number }>;
  escrowsByStatus: {
    held: number;
    released: number;
    disputed: number;
    refunded: number;
  };
}

export default function WorkerDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    availableJobs: 0,
    inProgress: 0,
    completed: 0,
    totalEarnings: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    earnings: [],
    escrowsByStatus: {
      held: 0,
      released: 0,
      disputed: 0,
      refunded: 0,
    },
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateRange[0]) {
        params.set("date_from", dateRange[0].startOf("day").toISOString());
      }
      if (dateRange[1]) {
        params.set("date_to", dateRange[1].endOf("day").toISOString());
      }

      const response = await fetch(`/api/worker/dashboard/stats?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStats(result.data.stats);
        setChartData(result.data.chartData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      message.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates || [null, null]);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Format earnings chart data
  const earningsChartData = chartData.earnings.map((item) => ({
    date: dayjs(item.date).format("DD/MM"),
    earnings: item.earnings,
  }));

  // Format escrows by status chart data
  const escrowsChartData = [
    {
      name: t("worker.dashboard.status.held"),
      value: chartData.escrowsByStatus.held,
    },
    {
      name: t("worker.dashboard.status.released"),
      value: chartData.escrowsByStatus.released,
    },
    {
      name: t("worker.dashboard.status.disputed"),
      value: chartData.escrowsByStatus.disputed,
    },
    {
      name: t("worker.dashboard.status.refunded"),
      value: chartData.escrowsByStatus.refunded,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Header with Date Filter */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>{t("worker.dashboard.title")}</Title>
          </Col>
          <Col>
            <Space>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                placeholder={[
                  t("common.startDate"),
                  t("common.endDate"),
                ]}
              />
              <ReloadOutlined
                onClick={handleRefresh}
                style={{ fontSize: 18, cursor: "pointer" }}
                spin={loading}
              />
            </Space>
          </Col>
        </Row>

        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t("worker.dashboard.availableJobs")}
                    value={stats.availableJobs}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: "#3f8600" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t("worker.dashboard.inProgress")}
                    value={stats.inProgress}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t("worker.dashboard.completed")}
                    value={stats.completed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: "#52c41a" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title={t("worker.dashboard.totalEarnings")}
                    value={stats.totalEarnings}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]}>
              {/* Earnings Chart */}
              <Col xs={24} lg={16}>
                <Card
                  title={t("worker.dashboard.earningsChart")}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={earningsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          `$${value.toFixed(2)}`,
                          t("worker.dashboard.earnings"),
                        ]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="earnings"
                        stroke="#1890ff"
                        strokeWidth={2}
                        name={t("worker.dashboard.earnings")}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              {/* Escrows by Status Chart */}
              <Col xs={24} lg={8}>
                <Card
                  title={t("worker.dashboard.escrowsByStatus")}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={escrowsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#1890ff" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Space>
    </div>
  );
}
