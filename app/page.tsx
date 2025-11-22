"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  HeroSection,
  StatisticsSection,
  FeaturesSection,
  CategoriesSection,
  HowItWorksSection,
  TestimonialsSection,
  TrustBadgesSection,
  CTASection,
} from "@/features/home/components";

export default function Home() {
  return (
    <MainLayout>
      <HeroSection />
      <StatisticsSection />
      <FeaturesSection />
      <CategoriesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <TrustBadgesSection />
      <CTASection />
    </MainLayout>
  );
}
