"use client";

import { HeartOutlined, StarFilled, HeartFilled } from "@ant-design/icons";
import Image from "next/image";
import { useState } from "react";

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
}

interface ListingCardProps {
    data: WorkerProfile;
}

export default function ListingCard({ data }: ListingCardProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="col-span-1 cursor-pointer group">
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
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFavorite(!isFavorite);
                            }}
                            className="relative hover:opacity-80 transition cursor-pointer"
                        >
                            {isFavorite ? (
                                <HeartFilled className="text-2xl text-[#FF385C]" />
                            ) : (
                                <HeartOutlined
                                    className="text-2xl text-white drop-shadow-md"
                                    style={{ strokeWidth: "20px" }}
                                />
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex flex-row items-start justify-between">
                    <div className="font-semibold text-[15px] text-gray-900 leading-5">{data.name}</div>
                    <div className="flex items-center gap-1 text-[15px]">
                        <StarFilled className="text-black text-[14px]" />
                        <span className="text-gray-900 font-light">{data.rating}</span>
                    </div>
                </div>
                <div className="font-light text-neutral-500 text-[15px] leading-4">
                    {data.role}
                </div>
                <div className="font-light text-neutral-500 text-[15px] leading-4">
                    {data.distance}
                </div>
                <div className="flex flex-row items-center gap-1 mt-1">
                    <div className="font-semibold text-[15px] text-gray-900">
                        $ {data.price}
                    </div>
                    <div className="font-light text-gray-900 text-[15px]">hour</div>
                </div>
            </div>
        </div>
    );
}
