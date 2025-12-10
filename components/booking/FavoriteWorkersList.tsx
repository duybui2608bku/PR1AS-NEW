"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Empty, Spin, Alert } from "antd";
import { favoritesAPI, Favorite } from "@/lib/favorites/api-client";
import ListingCard, { WorkerProfile } from "@/features/home/components/ListingCard";

export default function FavoriteWorkersList() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await favoritesAPI.getFavorites();
        
        // Log for debugging
        console.log("Favorites response:", response);
        
        if (!response || !response.favorites) {
          console.warn("Invalid favorites response:", response);
          setFavorites([]);
          return;
        }
        
        setFavorites(response.favorites || []);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : t("favorites.fetchError") || "Failed to load favorite workers";
        setError(errorMessage);
        setFavorites([]); // Reset favorites on error
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [t]);

  // Transform favorites API data to WorkerProfile format
  const transformedWorkers: WorkerProfile[] = useMemo(() => {
    return favorites
      .filter((fav) => fav.worker_profile) // Only include favorites with worker profile data
      .map((fav) => {
        const worker = fav.worker_profile;

        // Get the first service for role display
        // Handle services as array
        const services = Array.isArray(worker.services) ? worker.services : [];
        const firstService = services[0];
        
        const serviceName = firstService?.service?.name_key
          ? t(`services.${firstService.service.name_key}`, {
              defaultValue: firstService.service.name_key,
            })
          : t("common.service") || "Service";

        // Get avatar image from images array (filter by image_type = 'avatar')
        // Handle images as array
        const images = Array.isArray(worker.images) ? worker.images : [];
        const avatarImage = images.find(
          (img: any) => img.image_type === "avatar"
        );
        const imageSrc =
          avatarImage?.image_url ||
          images[0]?.image_url ||
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80";

        // Get price (use first service price)
        // Handle pricing as array or object
        let price = 0;
        if (firstService?.pricing) {
          if (Array.isArray(firstService.pricing)) {
            // If pricing is array, get first active pricing or first one
            const activePricing = firstService.pricing.find((p: any) => p.is_active !== false) || firstService.pricing[0];
            price = activePricing?.price_usd || 0;
          } else {
            // If pricing is object
            price = firstService.pricing.price_usd || 0;
          }
        }

        // Get category from first service
        const category = firstService?.service?.slug || "general";

        // Use nickname if available, otherwise full_name
        const displayName = worker.nickname || worker.full_name || "Unknown Worker";

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
          isFavorite: true, // All items in favorites are favorited
        };
      });
  }, [favorites, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="[&_.ant-alert-message]:dark:text-white [&_.ant-alert-description]:dark:text-gray-300">
        <Alert
          message={t("common.error") || "Error"}
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  if (transformedWorkers.length === 0) {
    return (
      <div className="[&_.ant-empty-description]:dark:text-white">
        <Empty
          description={
            t("favorites.empty") || "You haven't added any workers to favorites yet"
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 dark:text-white">
      {transformedWorkers.map((worker) => (
        <ListingCard key={worker.id} data={worker} />
      ))}
    </div>
  );
}

