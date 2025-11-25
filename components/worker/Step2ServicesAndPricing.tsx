"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Empty,
  Spin,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  PictureOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { showMessage } from "@/lib/utils/toast";
import { getErrorMessage } from "@/lib/utils/common";
import {
  servicesAPI,
  workerServicesAPI,
  workerImagesAPI,
} from "@/lib/worker/api-client";
import {
  WorkerProfileComplete,
  Service,
  ServiceWithPrice,
} from "@/lib/worker/types";
import { WorkerImageType } from "@/lib/utils/enums";
import ImageUpload from "@/components/common/ImageUpload";
import ServiceSelector from "@/components/worker/ServiceSelector";
import ServiceCard from "@/components/worker/ServiceCard";

const { Title, Paragraph } = Typography;

interface Step2ServicesAndPricingProps {
  profile: WorkerProfileComplete | null;
  onComplete: () => void;
  onBack: () => void;
}

export default function Step2ServicesAndPricing({
  profile,
  onComplete,
  onBack,
}: Step2ServicesAndPricingProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [workerServices, setWorkerServices] = useState<ServiceWithPrice[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    profile?.avatar?.image_url
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    profile?.gallery_images?.map((img) => img.image_url) || []
  );
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, workerServicesData] = await Promise.all([
        servicesAPI.getServices(),
        workerServicesAPI.getServices(),
      ]);
      setServices(servicesData);
      setWorkerServices(workerServicesData);
    } catch (error) {
      showMessage.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (url: string | undefined, filePath?: string) => {
    if (!url || !filePath) return;

    try {
      setSavingImage(true);
      setAvatarUrl(url);

      await workerImagesAPI.addImage({
        image_url: url,
        file_path: filePath,
        image_type: WorkerImageType.AVATAR,
      });

      showMessage.success(t("worker.profile.avatarUploaded"));
    } catch (error) {
      showMessage.error(getErrorMessage(error));
    } finally {
      setSavingImage(false);
    }
  };

  const handleGalleryAdd = async (url: string | undefined, filePath?: string) => {
    if (!url || !filePath) return;

    try {
      setSavingImage(true);
      setGalleryUrls([...galleryUrls, url]);
      await workerImagesAPI.addImage({
        image_url: url,
        file_path: filePath,
        image_type: WorkerImageType.GALLERY,
      });

      showMessage.success(t("worker.profile.imageAdded"));
    } catch (error) {
      showMessage.error(getErrorMessage(error));
    } finally {
      setSavingImage(false);
    }
  };

  const handleServiceAdded = () => {
    setShowServiceSelector(false);
    loadData();
  };

  const handleServiceRemoved = async (workerServiceId: string) => {
    try {
      await workerServicesAPI.removeService(workerServiceId);
      showMessage.success(t("worker.profile.serviceRemoved"));
      loadData();
    } catch (error) {
      showMessage.error(getErrorMessage(error));
    }
  };

  const handleContinue = () => {
    if (!avatarUrl) {
      showMessage.error(t("worker.profile.avatarRequired"));
      return;
    }

    if (workerServices.length === 0) {
      showMessage.error(t("worker.profile.atLeastOneService"));
      return;
    }

    onComplete();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  return (
    <div>
      <Title level={3}>{t("worker.profile.servicesAndPricingTitle")}</Title>
      <Paragraph type="secondary">
        {t("worker.profile.servicesAndPricingDesc")}
      </Paragraph>

      {/* Images Section */}
      <Card
        title={
          <Space>
            <PictureOutlined />
            {t("worker.profile.imagesSection")}
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Title level={5}>{t("worker.profile.avatar")} *</Title>
            <ImageUpload
              value={avatarUrl}
              onChange={handleAvatarChange}
              folder="worker-avatars"
              type="avatar"
            />
            {!avatarUrl && (
              <Paragraph
                type="secondary"
                style={{ marginTop: 8, fontSize: 12 }}
              >
                {t("worker.profile.avatarHint")}
              </Paragraph>
            )}
          </Col>

          <Col xs={24} md={16}>
            <Title level={5}>{t("worker.profile.gallery")}</Title>
            <Space direction="horizontal" style={{ width: "100%" }}>
              {galleryUrls.map((url, index) => (
                <img
                  key={url}
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
              ))}
              <ImageUpload
                value={undefined}
                onChange={handleGalleryAdd}
                folder="worker-gallery"
                type="image"
              />
            </Space>
            <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              {t("worker.profile.galleryHint")}
            </Paragraph>
          </Col>
        </Row>
      </Card>

      {/* Services Section */}
      <Card
        title={
          <Space>
            <ShoppingOutlined />
            {t("worker.profile.servicesSection")}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowServiceSelector(true)}
          >
            {t("worker.profile.addService")}
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        {workerServices.length === 0 ? (
          <Empty
            description={t("worker.profile.noServicesYet")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowServiceSelector(true)}
            >
              {t("worker.profile.addFirstService")}
            </Button>
          </Empty>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {workerServices.map((service) => (
              <ServiceCard
                key={service.worker_service?.id}
                service={service}
                onRemove={() =>
                  handleServiceRemoved(service.worker_service!.id)
                }
              />
            ))}
          </Space>
        )}
      </Card>

      {/* Service Selector Modal */}
      {showServiceSelector && (
        <ServiceSelector
          visible={showServiceSelector}
          services={services}
          onClose={() => setShowServiceSelector(false)}
          onServiceAdded={handleServiceAdded}
        />
      )}

      <Divider />

      {/* Navigation Buttons */}
      <div style={{ textAlign: "right" }}>
        <Space>
          <Button size="large" onClick={onBack}>
            {t("common.back")}
          </Button>
          <Button size="large" type="primary" onClick={handleContinue}>
            {t("common.continue")}
          </Button>
        </Space>
      </div>
    </div>
  );
}
