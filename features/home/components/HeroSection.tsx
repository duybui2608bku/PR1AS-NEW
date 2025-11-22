"use client";

import { useRef } from "react";
import { Button, Typography, Carousel } from "antd";
import {
  SearchOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { CarouselRef } from "antd/es/carousel";

const { Title, Paragraph } = Typography;

export default function HeroSection() {
  const { t } = useTranslation();
  const carouselRef = useRef<CarouselRef>(null);

  return (
    <section className="relative bg-gradient-to-br from-[#690F0F] via-[#8B1818] to-[#690F0F] text-white overflow-hidden">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32">
        <Carousel
          ref={carouselRef}
          autoplay
          effect="fade"
          dots={true}
          className="hero-carousel"
        >
          {/* Slide 1 */}
          <div>
            <div className="text-center">
              <Title
                level={1}
                className="!text-white !text-3xl sm:!text-4xl md:!text-5xl lg:!text-6xl xl:!text-7xl !font-bold !mb-4 sm:!mb-6 !leading-tight"
              >
                {t("home.hero.slide1.title")}
              </Title>
              <Paragraph className="!text-white !text-base sm:!text-lg md:!text-xl lg:!text-2xl !mb-6 sm:!mb-8 max-w-3xl mx-auto px-4">
                {t("home.hero.slide1.description")}
              </Paragraph>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button
                    type="primary"
                    size="large"
                    icon={<SearchOutlined />}
                    className="!h-12 sm:!h-14 !px-6 sm:!px-8 !text-base sm:!text-lg !font-semibold !bg-white !text-[#690F0F] hover:!bg-gray-100 w-full sm:w-auto"
                  >
                    {t("home.hero.slide1.primaryCTA")}
                  </Button>
                </Link>
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button
                    size="large"
                    className="!h-12 sm:!h-14 !px-6 sm:!px-8 !text-base sm:!text-lg !font-semibold !bg-transparent !text-white !border-white hover:!bg-white/10 w-full sm:w-auto"
                  >
                    {t("home.hero.slide1.secondaryCTA")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Slide 2 */}
          <div>
            <div className="text-center">
              <Title
                level={1}
                className="!text-white !text-3xl sm:!text-4xl md:!text-5xl lg:!text-6xl xl:!text-7xl !font-bold !mb-4 sm:!mb-6 !leading-tight"
              >
                {t("home.hero.slide2.title")}
              </Title>
              <Paragraph className="!text-white !text-base sm:!text-lg md:!text-xl lg:!text-2xl !mb-6 sm:!mb-8 max-w-3xl mx-auto px-4">
                {t("home.hero.slide2.description")}
              </Paragraph>
              <div className="flex justify-center px-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button
                    type="primary"
                    size="large"
                    icon={<SafetyOutlined />}
                    className="!h-12 sm:!h-14 !px-6 sm:!px-8 !text-base sm:!text-lg !font-semibold !bg-white !text-[#690F0F] hover:!bg-gray-100 w-full sm:w-auto"
                  >
                    {t("home.hero.slide2.primaryCTA")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Slide 3 */}
          <div>
            <div className="text-center">
              <Title
                level={1}
                className="!text-white !text-3xl sm:!text-4xl md:!text-5xl lg:!text-6xl xl:!text-7xl !font-bold !mb-4 sm:!mb-6 !leading-tight"
              >
                {t("home.hero.slide3.title")}
              </Title>
              <Paragraph className="!text-white !text-base sm:!text-lg md:!text-xl lg:!text-2xl !mb-6 sm:!mb-8 max-w-3xl mx-auto px-4">
                {t("home.hero.slide3.description")}
              </Paragraph>
              <div className="flex justify-center px-4">
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    className="!h-12 sm:!h-14 !px-6 sm:!px-8 !text-base sm:!text-lg !font-semibold !bg-white !text-[#690F0F] hover:!bg-gray-100 w-full sm:w-auto"
                  >
                    {t("home.hero.slide3.primaryCTA")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Carousel>

        {/* Carousel Navigation Arrows */}
        <div className="hidden lg:block">
          <Button
            shape="circle"
            size="large"
            icon={<LeftOutlined />}
            onClick={() => carouselRef.current?.prev()}
            className="!absolute !left-4 !top-1/2 !-translate-y-1/2 !z-10 !bg-white/20 !border-white !text-white hover:!bg-white/30"
          />
          <Button
            shape="circle"
            size="large"
            icon={<RightOutlined />}
            onClick={() => carouselRef.current?.next()}
            className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !z-10 !bg-white/20 !border-white !text-white hover:!bg-white/30"
          />
        </div>
      </div>
    </section>
  );
}
