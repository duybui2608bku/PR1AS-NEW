"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Button,
  Spin,
  message,
  DatePicker,
  Space,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  HeartOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
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
import RecentActivity from "@/components/dashboard/RecentActivity";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardStats {
  totalBookings: number;
  totalBookingsThisMonth: number;
  bookingsTrend: number;
  activeServices: number;
  totalSpent: number;
  totalSpentTrend: number;
  favoriteWorkers: number;
}

interface ChartData {
  bookings: Array<{ date: string; bookings: number }>;
  spending: Array<{ date: string; spending: number }>;
  bookingsByStatus: {
    pending: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalBookingsThisMonth: 0,
    bookingsTrend: 0,
    activeServices: 0,
    totalSpent: 0,
    totalSpentTrend: 0,
    favoriteWorkers: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    bookings: [],
    spending: [],
    bookingsByStatus: {
      pending: 0,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    },
  });
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

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

      const response = await fetch(
        `/api/client/dashboard/stats?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result = await response.json();
      if (result.success && result.data) {
        console.log("Dashboard data:", result.data);
        setStats(result.data.stats);
        setChartData(result.data.chartData || {
          bookings: [],
          spending: [],
          bookingsByStatus: {
            pending: 0,
            confirmed: 0,
            inProgress: 0,
            completed: 0,
            cancelled: 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      message.error(t("common.error") || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates || [null, null]);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // Format bookings chart data
  const bookingsChartData = chartData.bookings.map((item) => ({
    date: dayjs(item.date).format("DD/MM"),
    bookings: item.bookings,
  }));

  // Format spending chart data
  const spendingChartData = chartData.spending.map((item) => ({
    date: dayjs(item.date).format("DD/MM"),
    spending: item.spending,
  }));

  // Format bookings by status chart data
  const bookingsByStatusChartData = [
    {
      name: t("booking.status.pending_worker_confirmation") || "Pending",
      value: chartData.bookingsByStatus.pending,
    },
    {
      name: t("booking.status.worker_confirmed") || "Confirmed",
      value: chartData.bookingsByStatus.confirmed,
    },
    {
      name: t("booking.status.in_progress") || "In Progress",
      value: chartData.bookingsByStatus.inProgress,
    },
    {
      name: t("booking.status.client_completed") || "Completed",
      value: chartData.bookingsByStatus.completed,
    },
    {
      name: t("booking.status.cancelled") || "Cancelled",
      value: chartData.bookingsByStatus.cancelled,
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
            {t("client.dashboard.welcome") || "Welcome back!"}
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {t("client.dashboard.subtitle") ||
              "Manage your service bookings and discover new providers."}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => router.push("/client/post-job")}
        >
          {t("client.dashboard.bookService") || "Book Service"}
        </Button>
      </div>

      {/* Date Filter Section */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            placeholder={[
              t("common.startDate") || "Start Date",
              t("common.endDate") || "End Date",
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            {t("common.refresh") || "Refresh"}
          </Button>
        </Space>
      </Card>

      {/* Statistics Section */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t("client.dashboard.totalBookings") || "Total Bookings"}
                  value={stats.totalBookingsThisMonth}
                  prefix={<CalendarOutlined />}
                  suffix={
                    stats.bookingsTrend !== 0 ? (
                      <span
                        style={{
                          fontSize: 14,
                          color: stats.bookingsTrend >= 0 ? "#52c41a" : "#ff4d4f",
                        }}
                      >
                        {stats.bookingsTrend >= 0 ? (
                          <ArrowUpOutlined />
                        ) : (
                          <ArrowUpOutlined style={{ transform: "rotate(180deg)" }} />
                        )}{" "}
                        {stats.bookingsTrend >= 0 ? "+" : ""}
                        {stats.bookingsTrend}%
                      </span>
                    ) : null
                  }
                  valueStyle={{ color: "#1890ff" }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("client.dashboard.thisMonth") || "This month"}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t("client.dashboard.activeServices") || "Active Services"}
                  value={stats.activeServices}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("client.dashboard.inProgress") || "In progress"}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t("client.dashboard.totalSpent") || "Total Spent"}
                  value={stats.totalSpent}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: "#1890ff" }}
                  suffix={
                    stats.totalSpentTrend !== 0 ? (
                      <span
                        style={{
                          fontSize: 14,
                          color: stats.totalSpentTrend >= 0 ? "#52c41a" : "#ff4d4f",
                        }}
                      >
                        {stats.totalSpentTrend >= 0 ? (
                          <ArrowUpOutlined />
                        ) : (
                          <ArrowUpOutlined style={{ transform: "rotate(180deg)" }} />
                        )}{" "}
                        {stats.totalSpentTrend >= 0 ? "+" : ""}
                        {stats.totalSpentTrend}%
                      </span>
                    ) : null
                  }
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("client.dashboard.allTime") || "All time"}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title={t("client.dashboard.favoriteWorkers") || "Favorite Workers"}
                  value={stats.favoriteWorkers}
                  prefix={<HeartOutlined />}
                  valueStyle={{ color: "#ff4d4f" }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t("client.dashboard.savedProfiles") || "Saved profiles"}
                </Text>
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <Card title={t("client.dashboard.bookingsChart") || "Bookings Over Time"}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={bookingsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      stroke="#1890ff"
                      name={t("client.dashboard.bookings") || "Bookings"}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={t("client.dashboard.spendingChart") || "Spending Over Time"}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={spendingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="spending"
                      stroke="#52c41a"
                      name={t("client.dashboard.spending") || "Spending ($)"}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Bookings by Status Chart */}
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} lg={12}>
              <Card
                title={t("client.dashboard.bookingsByStatus") || "Bookings by Status"}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingsByStatusChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill="#1890ff"
                      name={t("client.dashboard.count") || "Count"}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Recent Activity Section */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={24}>
              <RecentActivity limit={4} />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}
