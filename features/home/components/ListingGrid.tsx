"use client";

import { useTranslation } from "react-i18next";
import ListingCard, { WorkerProfile } from "./ListingCard";

interface ListingGridProps {
  selectedCategory: string | null;
}

interface MockWorkerData {
  id: string;
  name: string;
  roleKey: string;
  locationKey: string;
  distance: number | "remote";
  price: number;
  rating: number;
  imageSrc: string;
  category: string;
}

export default function ListingGrid({ selectedCategory }: ListingGridProps) {
  const { t } = useTranslation();

  // Mock Data for Workers (with translation keys)
  const mockWorkers: MockWorkerData[] = [
    {
      id: "1",
      name: "Sarah Jenkins",
      roleKey: "mockdata.workers.role.interpreterEnJp",
      locationKey: "mockdata.workers.location.tokyo",
      distance: 2,
      price: 45,
      rating: 4.98,
      imageSrc:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
      category: "interpreter",
    },
    {
      id: "2",
      name: "David Chen",
      roleKey: "mockdata.workers.role.personalAssistant",
      locationKey: "mockdata.workers.location.newYork",
      distance: 5,
      price: 35,
      rating: 4.92,
      imageSrc:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
      category: "personal",
    },
    {
      id: "3",
      name: "Elena Rodriguez",
      roleKey: "mockdata.workers.role.tourGuide",
      locationKey: "mockdata.workers.location.barcelona",
      distance: 1,
      price: 40,
      rating: 4.95,
      imageSrc:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
      category: "tourGuide",
    },
    {
      id: "4",
      name: "Michael Chang",
      roleKey: "mockdata.workers.role.remoteAssistant",
      locationKey: "mockdata.workers.location.singapore",
      distance: "remote",
      price: 25,
      rating: 4.88,
      imageSrc:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80",
      category: "remote",
    },
    {
      id: "5",
      name: "Yuki Tanaka",
      roleKey: "mockdata.workers.role.companionshipLevel1",
      locationKey: "mockdata.workers.location.kyoto",
      distance: 3,
      price: 30,
      rating: 4.99,
      imageSrc:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
      category: "level1",
    },
    {
      id: "6",
      name: "James Wilson",
      roleKey: "mockdata.workers.role.onsiteProfessional",
      locationKey: "mockdata.workers.location.london",
      distance: 4,
      price: 50,
      rating: 4.9,
      imageSrc:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      category: "onsite",
    },
    {
      id: "7",
      name: "Anna Kowalski",
      roleKey: "mockdata.workers.role.interpreterPlEn",
      locationKey: "mockdata.workers.location.warsaw",
      distance: 1.5,
      price: 40,
      rating: 4.85,
      imageSrc:
        "https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&w=800&q=80",
      category: "interpreter",
    },
    {
      id: "8",
      name: "Kenji Sato",
      roleKey: "mockdata.workers.role.companionshipLevel2",
      locationKey: "mockdata.workers.location.osaka",
      distance: 2.5,
      price: 60,
      rating: 4.97,
      imageSrc:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
      category: "level2",
    },
    {
      id: "9",
      name: "Sophie Martin",
      roleKey: "mockdata.workers.role.tourGuide",
      locationKey: "mockdata.workers.location.paris",
      distance: 0.5,
      price: 55,
      rating: 4.96,
      imageSrc:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      category: "tourGuide",
    },
    {
      id: "10",
      name: "Liam O'Connor",
      roleKey: "mockdata.workers.role.companionshipLevel1",
      locationKey: "mockdata.workers.location.dublin",
      distance: 3,
      price: 35,
      rating: 4.91,
      imageSrc:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      category: "level1",
    },
  ];

  // Transform mock data to WorkerProfile with translations
  const workers: WorkerProfile[] = mockWorkers.map((worker) => ({
    id: worker.id,
    name: worker.name,
    role: t(worker.roleKey),
    location: t(worker.locationKey),
    distance:
      worker.distance === "remote"
        ? t("mockdata.workers.distance.remote")
        : t("mockdata.workers.distance.kmAway", { distance: worker.distance }),
    price: worker.price,
    rating: worker.rating,
    imageSrc: worker.imageSrc,
    category: worker.category,
  }));

  const filteredWorkers = selectedCategory
    ? workers.filter((worker) => worker.category === selectedCategory)
    : workers;

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
