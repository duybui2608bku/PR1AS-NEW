"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Spin } from "antd";
import ListingCard, { WorkerProfile } from "./ListingCard";
import { marketAPI } from "@/lib/market/api-client";
import { WorkerMarketProfile } from "@/lib/market/types";

interface ListingGridProps {
  selectedCategory: string | null;
}

export default function ListingGrid({ selectedCategory }: ListingGridProps) {
  const { t } = useTranslation();
  const [workers, setWorkers] = useState<WorkerMarketProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workers from API
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await marketAPI.getWorkers({
          limit: 50, // Fetch more workers for home page
        });
        setWorkers(response.workers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workers");
        setWorkers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Transform API data to WorkerProfile format
  const transformedWorkers: WorkerProfile[] = useMemo(() => {
    return workers.map((worker) => {
      // Get the first service for role display
      const firstService = worker.services?.[0];
      const serviceName = firstService?.service?.name_key
        ? t(`services.${firstService.service.name_key}`, {
            defaultValue: firstService.service.name_key,
          })
        : t("common.service");

      // Get avatar image or use placeholder
      const imageSrc =
        worker.avatar?.image_url ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80";

      // Get price (use min_price if available, otherwise use first service price)
      const price = worker.min_price || firstService?.pricing?.price_usd || 0;

      // Get category from first service
      const category = firstService?.service?.slug || "general";

      // Use nickname if available, otherwise full_name
      const displayName = worker.nickname || worker.full_name;

      return {
        id: worker.id,
        name: displayName,
        role: serviceName,
        location: "", // Location not available in API response
        distance: "", // Distance not available in API response
        price: Math.round(price),
        rating: 4.7, // Default rating (can be enhanced later with actual ratings)
        imageSrc,
        category,
      };
    });
  }, [workers, t]);

  // Filter workers by category if selected
  const filteredWorkers = useMemo(() => {
    if (!selectedCategory) {
      return transformedWorkers;
    }

    // Map category IDs to service slugs or names
    // This is a simple mapping - can be enhanced based on actual category structure
    return transformedWorkers.filter((worker) => {
      // For now, we'll show all workers when a category is selected
      // This can be enhanced to filter by actual service categories
      return true;
    });
  }, [transformedWorkers, selectedCategory]);

  if (loading) {
    return (
      <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4 py-8">
        <div className="flex justify-center items-center py-20 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
        {filteredWorkers.map((worker) => (
          <ListingCard key={worker.id} data={worker} />
        ))}
      </div>
      {filteredWorkers.length === 0 && (
        <div className="flex justify-center items-center py-20 text-neutral-500">
          {t("mockdata.noWorkersInCategory")}
        </div>
      )}
    </div>
  );
}
