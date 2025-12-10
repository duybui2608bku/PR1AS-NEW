"use client";

import { HeartOutlined, StarFilled, HeartFilled } from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { favoritesAPI } from "@/lib/favorites/api-client";
import { authAPI } from "@/lib/auth/api-client";
import { showNotification } from "@/lib/utils/toast";

export interface WorkerProfile {
  id: string;
  name: string;
  role: string;
  location: string;
  distance: string;
  price: number;
  rating: number;
  imageSrc: string;
  category: string;
  isFavorite?: boolean; // Optional prop to set initial favorite state
}

interface ListingCardProps {
  data: WorkerProfile;
}

export default function ListingCard({ data }: ListingCardProps) {
  const [isFavorite, setIsFavorite] = useState(data.isFavorite || false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authAPI.getProfile();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Set initial favorite state from prop
  useEffect(() => {
    if (data.isFavorite !== undefined) {
      setIsFavorite(data.isFavorite);
    }
  }, [data.isFavorite]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not authenticated, redirect to login or show message
    if (!isAuthenticated) {
      showNotification.warning(
        t("favorites.loginRequired") || "Please login to add favorites"
      );
      return;
    }

    setIsLoading(true);
    try {
      if (isFavorite) {
        await favoritesAPI.removeFavorite(data.id);
        setIsFavorite(false);
        showNotification.success(
          t("favorites.removed") || "Removed from favorites"
        );
      } else {
        await favoritesAPI.addFavorite(data.id);
        setIsFavorite(true);
        showNotification.success(t("favorites.added") || "Added to favorites");
      }
    } catch (error) {
      console.error("Favorite error:", error);
      showNotification.error(
        error instanceof Error
          ? error.message
          : t("favorites.error") || "Failed to update favorite"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link
      href={`/workers/${data.id}`}
      className="col-span-1 cursor-pointer group"
    >
      <div className="flex flex-col gap-1 w-full">
        <div className="aspect-square w-full relative overflow-hidden rounded-xl mb-1">
          <Image
            fill
            alt={data.name}
            src={data.imageSrc}
            className="object-cover h-full w-full group-hover:scale-105 transition duration-300"
          />
          <div className="absolute top-3 right-3">
            <button
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className="relative hover:opacity-80 transition cursor-pointer disabled:opacity-50"
            >
              {isFavorite ? (
                <HeartFilled
                  className="text-2xl"
                  style={{ color: "#ec4899", fill: "#ec4899" }}
                />
              ) : (
                <HeartOutlined
                  className="text-2xl drop-shadow-md"
                  style={{
                    strokeWidth: "20px",
                    opacity: 0.8,
                    color: "#ec4899",
                    stroke: "#ec4899",
                  }}
                />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-row items-start justify-between">
          <div className="font-semibold text-[15px] text-gray-900 dark:text-white leading-5">
            {data.name}
          </div>
          <div className="flex items-center gap-1 text-[15px]">
            <StarFilled className="text-[#FF385C] text-[14px]" />
            <span className="text-gray-900 dark:text-white font-light">
              {data.rating}
            </span>
          </div>
        </div>
        <div className="font-light text-neutral-500 dark:text-neutral-400 text-[15px] leading-4">
          {data.role}
        </div>
        <div className="font-light text-neutral-500 dark:text-neutral-400 text-[15px] leading-4">
          {data.distance}
        </div>
        <div className="flex flex-row items-center gap-1 mt-1">
          <div className="font-semibold text-[15px] text-gray-900 dark:text-white">
            $ {data.price}
          </div>
          <div className="font-light text-gray-900 dark:text-white text-[15px]">
            {t("mockdata.hour")}
          </div>
        </div>
      </div>
    </Link>
  );
}
