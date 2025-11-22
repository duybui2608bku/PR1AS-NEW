"use client";

import { Card, Row, Col, Statistic, Typography } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Title } = Typography;

export default function AdminDashboard() {
  const { t } = useTranslation();
  
  return (
    <div>
      <Title level={2}>{t("admin.dashboard.title")}</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.totalUsers")}
              value={1234}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.activeWorkers")}
              value={456}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.totalJobs")}
              value={789}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t("admin.dashboard.revenue")}
              value={93256}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

