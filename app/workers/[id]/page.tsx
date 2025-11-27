"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Avatar,
  Descriptions,
  Spin,
  Result,
  Image,
} from "antd";
import {
  UserOutlined,
  HeartOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { WorkerProfileComplete } from "@/lib/worker/types";
import PublicServiceCard from "@/components/worker/PublicServiceCard";

const { Title, Text, Paragraph } = Typography;

export default function WorkerPublicProfilePage() {
  const params = useParams();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<WorkerProfileComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/workers/${params.id}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || "Failed to fetch profile");
          return;
        }

        setProfile(data.data);
      } catch (err) {
        setError("Failed to load worker profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Result
          status="404"
          title={t("worker.profile.notFound")}
          subTitle={error || t("worker.profile.notFoundDescription")}
        />
      </div>
    );
  }

  const avatarUrl = profile.avatar?.image_url;
  const galleryImages = profile.gallery_images || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <Row gutter={[24, 24]}>
        {/* Profile Header */}
        <Col span={24}>
          <Card>
            <Row gutter={24} align="middle">
              <Col>
                <Avatar
                  size={120}
                  src={avatarUrl}
                  icon={!avatarUrl && <UserOutlined />}
                />
              </Col>
              <Col flex="auto">
                <Space direction="vertical" size="small">
                  <Title level={2} style={{ margin: 0 }}>
                    {profile.full_name}
                    {profile.nickname && (
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        ({profile.nickname})
                      </Text>
                    )}
                  </Title>
                  {profile.personal_quote && (
                    <Paragraph italic style={{ margin: 0 }}>
                      "{profile.personal_quote}"
                    </Paragraph>
                  )}
                  <Space wrap>
                    {profile.age && (
                      <Tag icon={<UserOutlined />}>
                        {profile.age} {t("worker.profile.yearsOld")}
                      </Tag>
                    )}
                    {profile.zodiac_sign && (
                      <Tag>{profile.zodiac_sign}</Tag>
                    )}
                    {profile.lifestyle && (
                      <Tag icon={<HeartOutlined />}>
                        {t(`worker.lifestyle.${profile.lifestyle}`)}
                      </Tag>
                    )}
                  </Space>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* About Me */}
        {profile.bio && (
          <Col span={24}>
            <Card title={t("worker.profile.aboutMe")}>
              <Paragraph>{profile.bio}</Paragraph>
            </Card>
          </Col>
        )}

        {/* Basic Information */}
        <Col xs={24} lg={12}>
          <Card title={t("worker.profile.basicInfo")}>
            <Descriptions column={1} size="small">
              {profile.height_cm && (
                <Descriptions.Item label={t("worker.profile.height")}>
                  {profile.height_cm} cm
                </Descriptions.Item>
              )}
              {profile.weight_kg && (
                <Descriptions.Item label={t("worker.profile.weight")}>
                  {profile.weight_kg} kg
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>

        {/* Tags/Interests */}
        {profile.tags && profile.tags.length > 0 && (
          <Col xs={24} lg={12}>
            <Card title={t("worker.profile.interests")}>
              <Space wrap>
                {profile.tags.map((tag) => (
                  <Tag key={tag.id} color="blue">
                    {t(`worker.tags.${tag.tag_key}`)}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        )}

        {/* Availability */}
        {profile.availabilities && profile.availabilities.length > 0 && (
          <Col span={24}>
            <Card title={<><CalendarOutlined /> {t("worker.profile.availability")}</>}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {profile.availabilities.map((avail) => (
                  <div key={avail.id}>
                    <Text strong>
                      {t(`common.daysOfWeek.${avail.day_of_week}`)}:{" "}
                    </Text>
                    {avail.availability_type === "all_day" && (
                      <Tag color="green">{t("worker.availability.allDay")}</Tag>
                    )}
                    {avail.availability_type === "time_range" && (
                      <Text>
                        {avail.start_time} - {avail.end_time}
                      </Text>
                    )}
                    {avail.availability_type === "not_available" && (
                      <Tag color="red">{t("worker.availability.notAvailable")}</Tag>
                    )}
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        )}

        {/* Services & Pricing */}
        {profile.services && profile.services.length > 0 && (
          <Col span={24}>
            <Card title={t("worker.profile.servicesOffered")}>
              <Space direction="vertical" style={{ width: "100%" }}>
                {profile.services
                  .filter((ws) => ws.service)
                  .map((ws) => (
                    <PublicServiceCard
                      key={ws.id}
                      service={{
                        ...ws.service!,
                        worker_service: ws,
                        pricing: ws.pricing,
                      }}
                    />
                  ))}
              </Space>
            </Card>
          </Col>
        )}

        {/* Gallery */}
        {galleryImages.length > 0 && (
          <Col span={24}>
            <Card title={t("worker.profile.gallery")}>
              <Image.PreviewGroup>
                <Row gutter={[16, 16]}>
                  {galleryImages.map((img) => (
                    <Col key={img.id} xs={12} sm={8} md={6} lg={4}>
                      <Image
                        src={img.image_url}
                        alt="Gallery"
                        style={{
                          width: "100%",
                          height: 150,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
}
