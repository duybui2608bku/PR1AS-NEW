"use client";

import { Card, Row, Col, Statistic, Typography, Divider } from "antd";
import {
  FileTextOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { FireDashboard } from "@/components/fire";

const { Title } = Typography;

export default function WorkerDashboard() {
  const { t } = useTranslation();
  return (
    <div>
      <Title level={2}>{t("worker.dashboard.title")}</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("worker.dashboard.availableJobs")}
              value={45}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("worker.dashboard.inProgress")}
              value={3}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("worker.dashboard.completed")}
              value={28}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("worker.dashboard.totalEarnings")}
              value={5420}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Fire Points System */}
      <Divider />
      <Title level={3}>Fire Points System</Title>
      <FireDashboard />
    </div>
  );
}
