"use client";

import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  CategoriesSection,
  ListingGrid,
} from "@/features/home/components";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <MainLayout>
      <CategoriesSection
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <ListingGrid selectedCategory={selectedCategory} />
    </MainLayout>
  );
}
