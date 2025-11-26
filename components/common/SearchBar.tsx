"use client";

import { SearchOutlined } from "@ant-design/icons";


export default function SearchBar() {
    return (
        <div className="hidden md:flex items-center border border-gray-300 rounded-full py-2.5 pl-6 pr-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white divide-x divide-gray-300">
            <div className="px-4 text-sm font-medium text-gray-900 truncate">
                Anywhere
            </div>
            <div className="px-4 text-sm font-medium text-gray-900 truncate">
                Any week
            </div>
            <div className="pl-4 pr-2 text-sm text-gray-600 flex items-center gap-3 truncate">
                <span>Add guests</span>
                <div className="bg-[#FF385C] rounded-full p-2 text-white flex items-center justify-center w-8 h-8">
                    <SearchOutlined style={{ fontSize: "12px", fontWeight: "bold" }} />
                </div>
            </div>
        </div>
    );
}
