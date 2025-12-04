"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Avatar,
  Badge,
  Button,
  Calendar,
  Card,
  Carousel,
  Col,
  Grid,
  Image,
  List,
  Progress,
  Rate,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import type { CarouselRef } from "antd/es/carousel";
import {
  ArrowsAltOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EditOutlined,
  FlagOutlined,
  HomeOutlined,
  LikeOutlined,
  MessageOutlined,
  StarOutlined,
  UserOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import {
  PriceTiers,
  WorkerProfileComplete,
  WorkerServicePrice,
} from "@/lib/worker/types";
import {
  AvailabilityType,
  Currency,
  DayOfWeek,
  HOURS_PER_DAY,
  HOURS_PER_MONTH,
  HOURS_PER_WEEK,
} from "@/lib/utils/enums";
import PublicServiceCard from "@/components/worker/PublicServiceCard";
import MainLayout from "@/components/layout/MainLayout";
import { BookingModal } from "@/components/booking";
import { authAPI } from "@/lib/auth/api-client";
import { chatAPI } from "@/lib/chat/api";
import { useRouter } from "next/navigation";
import { message } from "antd";

const { Title, Text, Paragraph } = Typography;

export default function WorkerPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [profile, setProfile] = useState<WorkerProfileComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(
    Currency.USD
  );
  const [chatLoading, setChatLoading] = useState(false);
  const carouselRef = useRef<CarouselRef | null>(null);

  const totalRating = 4.8;
  const totalReviews = 47;
  const ratingBreakdown = {
    5: 38,
    4: 7,
    3: 2,
    2: 0,
    1: 0,
  };
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<
    number | "all"
  >("all");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const reviews = [
    {
      id: 1,
      name: "Michael Johnson",
      avatar: "https://i.pravatar.cc/150?img=12",
      rating: 5,
      timeAgo: "13m trước",
      verified: true,
      comment:
        "Sarah exceeded all expectations! Her attention to detail in both cleaning and cooking is remarkable. She prepared amazing Asian fusion meals that my family absolutely loved. Very professional and trustworthy.",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      helpfulCount: 12,
    },
    {
      id: 2,
      name: "Emily Rodriguez",
      avatar: "https://i.pravatar.cc/150?img=47",
      rating: 5,
      timeAgo: "13m trước",
      verified: true,
      comment:
        "I've been working with Sarah for 3 months now and she's been incredible. Always punctual and thorough. Highly recommend!",
      helpfulCount: 5,
    },
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/workers/${params.id}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || t("worker.public.fetchError"));
          return;
        }

        setProfile(data.data);
      } catch {
        setError(t("worker.public.loadError"));
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
    // We intentionally omit `t` from dependencies to avoid refetching
    // whenever the language changes; error messages are non-critical.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Fetch user role to determine if booking button should be enabled
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const profile = await authAPI.getProfile();
        setUserRole(profile.role);
      } catch (error) {
        // User not authenticated or profile not found
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, []);

  // Handle chat button click
  const handleChatClick = async () => {
    if (!params.id || userRole !== "client") return;

    try {
      setChatLoading(true);
      const { conversation } = await chatAPI.createOrGetConversation(
        params.id as string,
        null
      );
      router.push(`/client/chat?conversationId=${conversation.id}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      message.error("Không thể tạo cuộc trò chuyện. Vui lòng thử lại!");
    } finally {
      setChatLoading(false);
    }
  };

  const servicesWithPricing = useMemo(() => {
    if (!profile?.services) return [];

    return profile.services
      .filter((ws) => ws.service && ws.pricing)
      .map((ws) => {
        const pricing = ws.pricing as WorkerServicePrice;
        const priceTiers = calculatePriceTiersClient(pricing);
        if (!priceTiers) return null;

        return {
          ...ws.service!,
          worker_service: ws,
          pricing,
          price_tiers: priceTiers,
        };
      })
      .filter(Boolean);
  }, [profile]);

  const mainService =
    servicesWithPricing && servicesWithPricing.length > 0
      ? servicesWithPricing[0]
      : null;

  const avatarUrl = profile?.avatar?.image_url || "";
  const galleryImages =
    profile?.gallery_images && profile.gallery_images.length > 0
      ? profile.gallery_images
      : profile?.images || [];

  const galleryList = (
    galleryImages && galleryImages.length > 0
      ? galleryImages
      : avatarUrl
      ? [{ id: "avatar", image_url: avatarUrl }]
      : []
  ) as Array<{ id: string; image_url: string }>;

  useEffect(() => {
    setCurrentImageIndex(0);
    carouselRef.current?.goTo(0, false);
  }, [galleryList.length]);

  useEffect(() => {
    if (mainService?.pricing?.primary_currency) {
      setDisplayCurrency(mainService.pricing.primary_currency);
    }
  }, [mainService]);

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

  const bookedDates: string[] = profile.booked_dates || [];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
          <Col xs={24} lg={15}>
            <Card style={{ borderRadius: 16, overflow: "hidden" }}>
              <Image.PreviewGroup>
                <Carousel
                  arrows={!isMobile}
                  dots={isMobile}
                  ref={carouselRef}
                  afterChange={(index) => setCurrentImageIndex(index)}
                >
                  {galleryList.map((img) => (
                    <div
                      key={img.id}
                      style={{
                        height: isMobile ? 220 : 320,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#000",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src={img.image_url}
                        alt={profile.full_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: isMobile ? 0 : 16,
                        }}
                      />
                    </div>
                  ))}
                </Carousel>
              </Image.PreviewGroup>

              {galleryList.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "16px",
                    borderTop: "1px solid #f0f0f0",
                    backgroundColor: "#fff",
                  }}
                >
                  {galleryList.map((img, index) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        setCurrentImageIndex(index);
                        carouselRef.current?.goTo(index, false);
                      }}
                      style={{
                        border: "none",
                        padding: 0,
                        background: "transparent",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: 12,
                          overflow: "hidden",
                          border:
                            index === currentImageIndex
                              ? "2px solid #FF385C"
                              : "2px solid transparent",
                          boxShadow:
                            index === currentImageIndex
                              ? "0 0 0 1px rgba(255,56,92,0.3)"
                              : "none",
                        }}
                      >
                        <Image
                          src={img.image_url}
                          alt={profile.full_name}
                          preview={false}
                          style={{
                            width: "100%",
                            height: isMobile ? 72 : 100,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
            {/* Worker information section */}
            <Row
              gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}
              style={{ marginTop: isMobile ? 16 : 24 }}
            >
              <Col span={24}>
                <Card>
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: "100%" }}
                  >
                    {/* Name and status */}
                    <div>
                      <Title level={2} style={{ marginBottom: 8 }}>
                        {profile.full_name}
                      </Title>
                      {profile.nickname && (
                        <Text type="secondary" style={{ fontSize: 16 }}>
                          ({profile.nickname})
                        </Text>
                      )}
                    </div>

                    {/* Basic info cards */}
                    <Row gutter={[16, 16]}>
                      {profile.age && (
                        <Col xs={12} sm={6}>
                          <Card
                            size="small"
                            style={{
                              textAlign: "center",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <CalendarOutlined
                              style={{
                                fontSize: 24,
                                color: "#FF385C",
                                marginBottom: 8,
                              }}
                            />
                            <div>
                              <Text
                                type="secondary"
                                style={{ display: "block" }}
                              >
                                {t("worker.profile.age")}
                              </Text>
                              <Text strong style={{ fontSize: 16 }}>
                                {t("worker.public.ageValue", {
                                  age: profile.age,
                                })}
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      )}
                      {profile.height_cm && (
                        <Col xs={12} sm={6}>
                          <Card
                            size="small"
                            style={{
                              textAlign: "center",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <VerticalAlignTopOutlined
                              style={{
                                fontSize: 24,
                                color: "#FF385C",
                                marginBottom: 8,
                              }}
                            />
                            <div>
                              <Text
                                type="secondary"
                                style={{ display: "block" }}
                              >
                                {t("worker.profile.height")}
                              </Text>
                              <Text strong style={{ fontSize: 16 }}>
                                {t("worker.public.heightValue", {
                                  height: profile.height_cm,
                                })}
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      )}
                      {profile.weight_kg && (
                        <Col xs={12} sm={6}>
                          <Card
                            size="small"
                            style={{
                              textAlign: "center",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <ArrowsAltOutlined
                              style={{
                                fontSize: 24,
                                color: "#FF385C",
                                marginBottom: 8,
                              }}
                            />
                            <div>
                              <Text
                                type="secondary"
                                style={{ display: "block" }}
                              >
                                {t("worker.profile.weight")}
                              </Text>
                              <Text strong style={{ fontSize: 16 }}>
                                {t("worker.public.weightValue", {
                                  weight: profile.weight_kg,
                                })}
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      )}
                      {profile.zodiac_sign && (
                        <Col xs={12} sm={6}>
                          <Card
                            size="small"
                            style={{
                              textAlign: "center",
                              border: "1px solid #f0f0f0",
                            }}
                          >
                            <StarOutlined
                              style={{
                                fontSize: 24,
                                color: "#FF385C",
                                marginBottom: 8,
                              }}
                            />
                            <div>
                              <Text
                                type="secondary"
                                style={{ display: "block" }}
                              >
                                {t("worker.profile.zodiacSign")}
                              </Text>
                              <Text strong style={{ fontSize: 16 }}>
                                {profile.zodiac_sign}
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      )}
                    </Row>

                    {/* Introduction */}
                    {profile.bio && (
                      <div>
                        <Title level={4}>
                          {t("worker.public.introductionTitle")}
                        </Title>
                        <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
                          {profile.bio}
                        </Paragraph>
                      </div>
                    )}

                    {/* Interests */}
                    {profile.tags && profile.tags.length > 0 && (
                      <div>
                        <Title level={4}>
                          {t("worker.profile.interestsAndHobbies")}
                        </Title>
                        <Space wrap>
                          {profile.tags.map((tag) => (
                            <Tag
                              key={tag.id}
                              color="blue"
                              style={{
                                padding: "4px 12px",
                                fontSize: 14,
                                cursor: "pointer",
                              }}
                            >
                              {tag.tag_value || tag.tag_key}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* Lifestyle */}
                    {profile.lifestyle && (
                      <div>
                        <Title level={4}>{t("worker.profile.lifestyle")}</Title>
                        <Paragraph style={{ fontSize: 15, lineHeight: 1.8 }}>
                          {t(`worker.lifestyle.${profile.lifestyle}`)}
                        </Paragraph>
                      </div>
                    )}

                    {/* Personal quote */}
                    {profile.personal_quote && (
                      <Card
                        type="inner"
                        title={t("worker.profile.personalQuote")}
                        style={{
                          borderLeft: "4px solid #FF385C",
                          backgroundColor: "#fff5f7",
                        }}
                      >
                        <Paragraph
                          italic
                          style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}
                        >
                          &quot;{profile.personal_quote}&quot;
                        </Paragraph>
                      </Card>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>
          </Col>

          <Col xs={24} lg={9}>
            <Card bodyStyle={isMobile ? { padding: 16 } : undefined}>
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Row
                  justify="space-between"
                  align="middle"
                  gutter={isMobile ? [0, 8] : undefined}
                >
                  <Col span={isMobile ? 24 : undefined}>
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">
                        {t("worker.public.serviceProvidedTitle")}
                      </Text>
                      <Space size={6}>
                        <CheckCircleFilled style={{ color: "#52c41a" }} />
                        <Text type="success">
                          {t("worker.public.serviceVerifiedLabel")}
                        </Text>
                      </Space>
                    </Space>
                  </Col>
                  <Col span={isMobile ? 24 : undefined}>
                    <Space size={8}>
                      <Text type="secondary">
                        {t("worker.public.currencyLabel")}
                      </Text>
                      <Select
                        size="small"
                        value={displayCurrency}
                        style={{ width: 90 }}
                        onChange={(value: Currency) =>
                          setDisplayCurrency(value)
                        }
                        options={[
                          { value: Currency.USD, label: "USD" },
                          { value: Currency.VND, label: "VND" },
                          { value: Currency.JPY, label: "JPY" },
                          { value: Currency.KRW, label: "KRW" },
                        ]}
                      />
                    </Space>
                  </Col>
                </Row>
                <div>
                  <Title level={3} style={{ marginTop: 4 }}>
                    {mainService
                      ? t(`services.${mainService.name_key}`)
                      : profile.full_name}
                  </Title>
                  <Space split={<span>•</span>} wrap>
                    <Space>
                      <HomeOutlined />
                      <Text>{t("worker.public.homecareCategory")}</Text>
                    </Space>
                    <Space>
                      <UserOutlined />
                      <Text strong>{profile.full_name}</Text>
                    </Space>
                  </Space>
                </div>

                {mainService?.price_tiers && mainService.pricing && (
                  <Row gutter={12}>
                    <Col span={8}>
                      <Card size="small">
                        <Text type="secondary">
                          {t("worker.public.priceHourly")}
                        </Text>
                        <Title level={4} style={{ marginTop: 8 }}>
                          {formatCurrencyClient(
                            convertAmount(
                              mainService.price_tiers.hourly,
                              mainService.price_tiers.currency,
                              displayCurrency
                            ),
                            displayCurrency
                          )}
                        </Title>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small" bordered>
                        <Text type="secondary">
                          {t("worker.public.priceDaily")}
                        </Text>
                        <Title level={4} style={{ marginTop: 8 }}>
                          {formatCurrencyClient(
                            convertAmount(
                              mainService.price_tiers.daily,
                              mainService.price_tiers.currency,
                              displayCurrency
                            ),
                            displayCurrency
                          )}
                        </Title>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Text type="secondary">
                          {t("worker.public.priceMonthly")}
                        </Text>
                        <Title level={4} style={{ marginTop: 8 }}>
                          {formatCurrencyClient(
                            convertAmount(
                              mainService.price_tiers.monthly,
                              mainService.price_tiers.currency,
                              displayCurrency
                            ),
                            displayCurrency
                          )}
                        </Title>
                      </Card>
                    </Col>
                  </Row>
                )}

                {/* Fake meta info under prices */}
                <Card
                  size="small"
                  style={{
                    marginTop: isMobile ? 12 : 16,
                    borderRadius: 12,
                    borderColor: "#f0f0f0",
                  }}
                  bodyStyle={{
                    padding: isMobile ? "10px 12px" : "12px 16px",
                  }}
                >
                  <Row gutter={24}>
                    <Col xs={24} sm={8}>
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {t("worker.public.responseLabel")}
                        </Text>
                        <Space size={4}>
                          <ClockCircleOutlined style={{ fontSize: 16 }} />
                          <Text>{t("worker.public.responseValue")}</Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {t("worker.public.experienceLabel")}
                        </Text>
                        <Space size={4}>
                          <UserOutlined style={{ fontSize: 16 }} />
                          <Text>{t("worker.public.experienceValue")}</Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">
                          {t("worker.public.statusLabel")}
                        </Text>
                        <Space size={4}>
                          <CheckCircleFilled
                            style={{ color: "#52c41a", fontSize: 16 }}
                          />
                          <Text type="success">
                            {t("worker.public.statusAvailable")}
                          </Text>
                        </Space>
                      </Space>
                    </Col>
                  </Row>
                </Card>

                {servicesWithPricing && servicesWithPricing.length > 1 && (
                  <div>
                    <Title level={4} style={{ marginBottom: 16 }}>
                      {t("worker.public.otherServicesTitle")}
                    </Title>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {servicesWithPricing.slice(1).map((svc: any) => (
                        <PublicServiceCard
                          key={svc.worker_service.id}
                          service={svc}
                          displayCurrency={displayCurrency}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {userRole === "client" && mainService && (
                  <>
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={() => setBookingModalOpen(true)}
                    >
                      {t("worker.public.bookServiceButton")}
                    </Button>
                    <Button
                      size="large"
                      block
                      icon={<MessageOutlined />}
                      onClick={handleChatClick}
                      loading={chatLoading}
                    >
                      Nhắn tin
                    </Button>
                    <BookingModal
                      open={bookingModalOpen}
                      onClose={() => setBookingModalOpen(false)}
                      onSuccess={() => {
                        setBookingModalOpen(false);
                        // Refresh page or show success message
                      }}
                      workerId={params.id as string}
                      workerServiceId={mainService.worker_service.id}
                      workerName={profile?.full_name}
                      serviceName={
                        mainService.name_key
                          ? t(`services.${mainService.name_key}`)
                          : undefined
                      }
                      availableServices={
                        servicesWithPricing?.map((svc: any) => ({
                          id: svc.worker_service.id,
                          name: svc.name_key
                            ? t(`services.${svc.name_key}`)
                            : t("worker.public.unknownService"),
                        })) || []
                      }
                    />
                  </>
                )}
                {userRole !== "client" && (
                  <>
                    <Button type="primary" size="large" block disabled>
                      {t("worker.public.bookServiceButton")}
                    </Button>
                    <Button size="large" block icon={<MessageOutlined />} disabled>
                      Nhắn tin
                    </Button>
                  </>
                )}

                <Card
                  title={
                    <Space>
                      <CalendarOutlined />
                      <span>{t("worker.public.availableScheduleTitle")}</span>
                    </Space>
                  }
                >
                  <Calendar
                    fullscreen={false}
                    dateCellRender={(value) =>
                      renderAvailabilityCell(value, profile, bookedDates)
                    }
                  />
                  <Space style={{ marginTop: 12 }}>
                    <Badge
                      color="green"
                      text={t("worker.public.calendarAvailable")}
                    />
                    <Badge
                      color="red"
                      text={t("worker.public.calendarBooked")}
                    />
                  </Space>
                </Card>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Bottom section: reviews */}
        <Row
          gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}
          style={{ marginTop: isMobile ? 16 : 24 }}
        >
          <Col span={24}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{t("worker.public.reviewsTitle")}</span>
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => {
                      // TODO: Handle write review
                    }}
                  >
                    {t("worker.public.writeReviewButton")}
                  </Button>
                </div>
              }
            >
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Space
                    direction="vertical"
                    align="center"
                    style={{ width: "100%" }}
                  >
                    <Title level={2} style={{ marginBottom: 0 }}>
                      {totalRating.toFixed(1)}
                    </Title>
                    <Rate disabled value={totalRating} allowHalf />
                    <Text type="secondary">
                      {t("worker.public.totalReviewsLabel", {
                        count: totalReviews,
                      })}
                    </Text>
                    <div style={{ width: "100%", marginTop: 16 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count =
                          ratingBreakdown[star as 1 | 2 | 3 | 4 | 5];
                        const percent =
                          totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div
                            key={star}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              gap: 8,
                              marginBottom: 8,
                            }}
                          >
                            <Text style={{ width: 20, textAlign: "right" }}>
                              {star}
                            </Text>
                            <Rate
                              disabled
                              defaultValue={1}
                              count={1}
                              style={{ fontSize: 14 }}
                            />
                            <Progress
                              percent={percent}
                              showInfo={false}
                              style={{ flex: 1 }}
                              strokeColor="#faad14"
                            />
                            <Text style={{ width: 30, textAlign: "left" }}>
                              {count}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </Space>
                </Col>

                <Col xs={24} md={16}>
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    {/* Filter section */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "flex-start" : "center",
                        gap: 8,
                      }}
                    >
                      <Text type="secondary">
                        {t("worker.public.filterByRatingLabel")}
                      </Text>
                      <Select
                        value={selectedRatingFilter}
                        placeholder={t("worker.public.ratingFilterAllLabel")}
                        style={{ width: 150 }}
                        onChange={(value) => setSelectedRatingFilter(value)}
                        options={[
                          {
                            value: "all",
                            label: t("worker.public.ratingFilterAllLabel"),
                          },
                          ...[5, 4, 3, 2, 1].map((star) => ({
                            value: star,
                            label: t("worker.public.ratingFilterStarLabel", {
                              count: star,
                            }),
                          })),
                        ]}
                      />
                    </div>

                    {/* Reviews list */}
                    <List
                      itemLayout="vertical"
                      dataSource={reviews.filter(
                        (r) =>
                          selectedRatingFilter === "all" ||
                          r.rating === selectedRatingFilter
                      )}
                      renderItem={(item) => (
                        <List.Item
                          key={item.id}
                          style={{
                            padding: "16px 0",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <Space
                            direction="vertical"
                            size="small"
                            style={{ width: "100%" }}
                          >
                            {/* Header: Avatar, Name, Verified, Time */}
                            <Space align="center">
                              <Avatar
                                src={item.avatar}
                                size={40}
                                icon={<UserOutlined />}
                              />
                              <Space direction="vertical" size={0}>
                                <Space align="center">
                                  <Text strong>{item.name}</Text>
                                  {item.verified && (
                                    <Tag color="green" style={{ margin: 0 }}>
                                      {t("worker.public.verifiedPurchase")}
                                    </Tag>
                                  )}
                                </Space>
                                <Space>
                                  <Rate
                                    disabled
                                    defaultValue={item.rating}
                                    style={{ fontSize: 14 }}
                                  />
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    {item.timeAgo}
                                  </Text>
                                </Space>
                              </Space>
                            </Space>

                            {/* Review text */}
                            <Paragraph
                              style={{ marginBottom: 8, marginTop: 8 }}
                            >
                              {item.comment}
                            </Paragraph>

                            {/* Review image */}
                            {item.image && (
                              <div style={{ marginBottom: 8 }}>
                                <Image
                                  src={item.image}
                                  alt={t("worker.public.reviewImageAlt")}
                                  width={120}
                                  height={120}
                                  style={{
                                    objectFit: "cover",
                                    borderRadius: 8,
                                  }}
                                  preview
                                />
                              </div>
                            )}

                            {/* Action buttons */}
                            <Space>
                              <Button
                                type="text"
                                size="small"
                                icon={<LikeOutlined />}
                                onClick={() => {
                                  // TODO: Handle helpful
                                }}
                              >
                                {t("worker.public.helpfulButtonLabel", {
                                  count: item.helpfulCount || 0,
                                })}
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                icon={<MessageOutlined />}
                                onClick={() => {
                                  // TODO: Handle reply
                                }}
                              >
                                {t("worker.public.replyButtonLabel")}
                              </Button>
                              <Button
                                type="text"
                                size="small"
                                icon={<FlagOutlined />}
                                danger
                                onClick={() => {
                                  // TODO: Handle report
                                }}
                              >
                                {t("worker.public.reportButtonLabel")}
                              </Button>
                            </Space>
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}

function calculatePriceTiersClient(
  pricing: WorkerServicePrice
): PriceTiers | null {
  const currencyKey =
    `price_${pricing.primary_currency.toLowerCase()}` as keyof WorkerServicePrice;
  const hourlyRate = pricing[currencyKey] as number | undefined;

  if (!hourlyRate) return null;

  const daily =
    hourlyRate * HOURS_PER_DAY * (1 - pricing.daily_discount_percent / 100);
  const weekly =
    hourlyRate * HOURS_PER_WEEK * (1 - pricing.weekly_discount_percent / 100);
  const monthly =
    hourlyRate * HOURS_PER_MONTH * (1 - pricing.monthly_discount_percent / 100);

  return {
    hourly: Math.round(hourlyRate * 100) / 100,
    daily: Math.round(daily * 100) / 100,
    weekly: Math.round(weekly * 100) / 100,
    monthly: Math.round(monthly * 100) / 100,
    currency: pricing.primary_currency,
  };
}

function convertAmount(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;

  const rates: Record<Currency, number> = {
    [Currency.USD]: 1,
    [Currency.VND]: 24000,
    [Currency.JPY]: 150,
    [Currency.KRW]: 1300,
    [Currency.CNY]: 7,
  };

  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;

  return (amount * toRate) / fromRate;
}

function formatCurrencyClient(amount: number, currency: string) {
  // Special handling for VND: show millions with "M" suffix
  if (currency === Currency.VND && amount >= 1000000) {
    const millions = amount / 1000000;
    // Format to 1 decimal place if needed, otherwise show as integer
    const formatted =
      millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${formatted}M`;
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

function renderAvailabilityCell(
  value: Dayjs,
  profile: WorkerProfileComplete,
  bookedDates: string[]
) {
  const dateStr = value.format("YYYY-MM-DD");

  if (bookedDates.includes(dateStr)) {
    return <Badge color="red" />;
  }

  const dayOfWeek = mapDayOfWeek(value);
  const dayAvailabilities = profile.availabilities?.filter(
    (a) => a.day_of_week === dayOfWeek
  );

  const hasAvailable = dayAvailabilities?.some(
    (a) =>
      a.availability_type === AvailabilityType.ALL_DAY ||
      a.availability_type === AvailabilityType.TIME_RANGE
  );

  if (hasAvailable) {
    return <Badge color="green" />;
  }

  return null;
}

function mapDayOfWeek(value: Dayjs): DayOfWeek {
  // dayjs: 0=Sunday ... 6=Saturday
  const day = value.day();
  switch (day) {
    case 0:
      return DayOfWeek.SUNDAY;
    case 1:
      return DayOfWeek.MONDAY;
    case 2:
      return DayOfWeek.TUESDAY;
    case 3:
      return DayOfWeek.WEDNESDAY;
    case 4:
      return DayOfWeek.THURSDAY;
    case 5:
      return DayOfWeek.FRIDAY;
    case 6:
    default:
      return DayOfWeek.SATURDAY;
  }
}
