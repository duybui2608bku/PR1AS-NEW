"use client";

import { useState, useEffect, useCallback } from "react";
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
  Modal,
} from "antd";
import {
  PlusOutlined,
  LoadingOutlined,
  PictureOutlined,
  ShoppingOutlined,
  DeleteOutlined,
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
import { PROFILE_CONSTRAINTS } from "@/lib/worker/constants";
import {
  validateGalleryImageCount,
  validateServicePricing,
} from "@/lib/worker/validation";
import { useRetry } from "@/lib/hooks/useRetry";
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
  const [removingServiceId, setRemovingServiceId] = useState<string | null>(null);
  const [previousGalleryUrls, setPreviousGalleryUrls] = useState<string[]>([]);

  // Retry logic for API calls
  const { execute: addImageWithRetry, loading: addingImage } = useRetry(
    workerImagesAPI.addImage,
    {
      maxRetries: 3,
      retryDelay: 1000,
    }
  );

  const { execute: removeServiceWithRetry } = useRetry(
    workerServicesAPI.removeService,
    {
      maxRetries: 3,
      retryDelay: 1000,
    }
  );

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

    const previousAvatar = avatarUrl;

    try {
      setSavingImage(true);
      // Optimistic update
      setAvatarUrl(url);

      await addImageWithRetry({
        image_url: url,
        file_path: filePath,
        image_type: WorkerImageType.AVATAR,
      });

      showMessage.success(t("worker.profile.avatarUploaded"));
    } catch (error) {
      // Rollback on error
      setAvatarUrl(previousAvatar);
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
        showMessage.error(t("common.networkError"));
      } else {
        showMessage.error(errorMessage);
      }
    } finally {
      setSavingImage(false);
    }
  };

  const handleGalleryAdd = async (url: string | undefined, filePath?: string) => {
    if (!url || !filePath) return;

    // Validate gallery image count
    const validation = validateGalleryImageCount(galleryUrls.length + 1);
    if (validation) {
      showMessage.error(validation);
      return;
    }

    const previousUrls = galleryUrls;

    try {
      setSavingImage(true);
      // Optimistic update
      const newUrls = [...galleryUrls, url];
      setGalleryUrls(newUrls);
      setPreviousGalleryUrls(previousUrls);

      await addImageWithRetry({
        image_url: url,
        file_path: filePath,
        image_type: WorkerImageType.GALLERY,
      });

      showMessage.success(t("worker.profile.imageAdded"));
    } catch (error) {
      // Rollback on error
      setGalleryUrls(previousUrls);
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
        showMessage.error(t("common.networkError"));
      } else {
        showMessage.error(errorMessage);
      }
    } finally {
      setSavingImage(false);
    }
  };

  const handleServiceAdded = useCallback(() => {
    setShowServiceSelector(false);
    loadData();
  }, []);

  // Check for duplicate services before adding
  const checkDuplicateService = useCallback((serviceId: string): boolean => {
    return workerServices.some(
      (ws) => ws.worker_service?.service_id === serviceId
    );
  }, [workerServices]);

  const handleServiceRemoved = async (workerServiceId: string) => {
    const service = workerServices.find(
      (ws) => ws.worker_service?.id === workerServiceId
    );
    const serviceName = service?.name_key || t("worker.profile.service");

    Modal.confirm({
      title: t("worker.profile.confirmRemoveService"),
      content: t("worker.profile.confirmRemoveServiceDesc", {
        service: serviceName,
      }),
      okText: t("common.remove"),
      okType: "danger",
      cancelText: t("common.cancel"),
      onOk: async () => {
        try {
          setRemovingServiceId(workerServiceId);
          await removeServiceWithRetry(workerServiceId);
          showMessage.success(t("worker.profile.serviceRemoved"));
          loadData();
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          if (errorMessage.includes("network") || errorMessage.includes("timeout")) {
            showMessage.error(t("common.networkError"));
          } else {
            showMessage.error(errorMessage);
          }
        } finally {
          setRemovingServiceId(null);
        }
      },
    });
  };

  const handleContinue = useCallback(() => {
    // Validate avatar
    if (!avatarUrl) {
      showMessage.error(t("worker.profile.avatarRequired"));
      return;
    }

    // Validate services count
    if (workerServices.length < PROFILE_CONSTRAINTS.MIN_SERVICES_REQUIRED) {
      showMessage.error(
        t("worker.profile.atLeastOneService", {
          min: PROFILE_CONSTRAINTS.MIN_SERVICES_REQUIRED,
        })
      );
      return;
    }

    // Validate that all services have pricing
    const servicesWithoutPricing = workerServices.filter(
      (ws) => !ws.pricing || !ws.pricing.price_usd
    );

    if (servicesWithoutPricing.length > 0) {
      showMessage.error(t("worker.profile.servicesNeedPricing"));
      return;
    }

    // Validate pricing ranges
    for (const service of workerServices) {
      if (service.pricing) {
        const pricingError = validateServicePricing(
          service.pricing.price_usd,
          service.pricing.daily_discount_percent,
          service.pricing.weekly_discount_percent,
          service.pricing.monthly_discount_percent
        );
        if (pricingError) {
          showMessage.error(
            `${service.name_key}: ${pricingError}`
          );
          return;
        }
      }
    }

    onComplete();
  }, [avatarUrl, workerServices, onComplete, t]);

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
            <Title level={5}>
              {t("worker.profile.gallery")}
              {galleryUrls.length >= PROFILE_CONSTRAINTS.MAX_GALLERY_IMAGES && (
                <span style={{ color: "#ff4d4f", fontSize: 12, marginLeft: 8 }}>
                  ({t("worker.profile.maxImagesReached", {
                    max: PROFILE_CONSTRAINTS.MAX_GALLERY_IMAGES,
                  })})
                </span>
              )}
            </Title>
            <Space direction="horizontal" style={{ width: "100%" }} wrap>
              {galleryUrls.map((url, index) => (
                <div key={url} style={{ position: "relative" }}>
                  <img
                    src={url}
                    alt={`Gallery ${index + 1}`}
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 8,
                    }}
                    onClick={() => {
                      const newUrls = galleryUrls.filter((_, i) => i !== index);
                      setGalleryUrls(newUrls);
                    }}
                  />
                </div>
              ))}
              {galleryUrls.length < PROFILE_CONSTRAINTS.MAX_GALLERY_IMAGES && (
                <ImageUpload
                  value={undefined}
                  onChange={handleGalleryAdd}
                  folder="worker-gallery"
                  type="image"
                />
              )}
            </Space>
            <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              {t("worker.profile.galleryHint", {
                max: PROFILE_CONSTRAINTS.MAX_GALLERY_IMAGES,
                current: galleryUrls.length,
              })}
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
          services={services.filter(
            (s) => !checkDuplicateService(s.id)
          )}
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
