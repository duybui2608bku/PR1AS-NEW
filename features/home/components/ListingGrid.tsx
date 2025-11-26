"use client";

import ListingCard, { WorkerProfile } from "./ListingCard";

interface ListingGridProps {
    selectedCategory: string | null;
}

export default function ListingGrid({ selectedCategory }: ListingGridProps) {
    // Mock Data for Workers
    const workers: WorkerProfile[] = [
        {
            id: "1",
            name: "Sarah Jenkins",
            role: "Interpreter (English - Japanese)",
            location: "Tokyo, Japan",
            distance: "2 km away",
            price: 45,
            rating: 4.98,
            imageSrc: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
            category: "interpreter"
        },
        {
            id: "2",
            name: "David Chen",
            role: "Personal Assistant",
            location: "New York, USA",
            distance: "5 km away",
            price: 35,
            rating: 4.92,
            imageSrc: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
            category: "personal"
        },
        {
            id: "3",
            name: "Elena Rodriguez",
            role: "Tour Guide",
            location: "Barcelona, Spain",
            distance: "1 km away",
            price: 40,
            rating: 4.95,
            imageSrc: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
            category: "tourGuide"
        },
        {
            id: "4",
            name: "Michael Chang",
            role: "Remote Assistant",
            location: "Singapore",
            distance: "Remote",
            price: 25,
            rating: 4.88,
            imageSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80",
            category: "remote"
        },
        {
            id: "5",
            name: "Yuki Tanaka",
            role: "Companionship - Level 1",
            location: "Kyoto, Japan",
            distance: "3 km away",
            price: 30,
            rating: 4.99,
            imageSrc: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
            category: "level1"
        },
        {
            id: "6",
            name: "James Wilson",
            role: "On-site Professional",
            location: "London, UK",
            distance: "4 km away",
            price: 50,
            rating: 4.90,
            imageSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
            category: "onsite"
        },
        {
            id: "7",
            name: "Anna Kowalski",
            role: "Interpreter (Polish - English)",
            location: "Warsaw, Poland",
            distance: "1.5 km away",
            price: 40,
            rating: 4.85,
            imageSrc: "https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&w=800&q=80",
            category: "interpreter"
        },
        {
            id: "8",
            name: "Kenji Sato",
            role: "Companionship - Level 2",
            location: "Osaka, Japan",
            distance: "2.5 km away",
            price: 60,
            rating: 4.97,
            imageSrc: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
            category: "level2"
        },
        {
            id: "9",
            name: "Sophie Martin",
            role: "Tour Guide",
            location: "Paris, France",
            distance: "0.5 km away",
            price: 55,
            rating: 4.96,
            imageSrc: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
            category: "tourGuide"
        },
        {
            id: "10",
            name: "Liam O'Connor",
            role: "Companionship - Level 1",
            location: "Dublin, Ireland",
            distance: "3 km away",
            price: 35,
            rating: 4.91,
            imageSrc: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
            category: "level1"
        }
    ];

    const filteredWorkers = selectedCategory
        ? workers.filter(worker => worker.category === selectedCategory)
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
                    No workers found in this category.
                </div>
            )}
        </div>
    );
}
