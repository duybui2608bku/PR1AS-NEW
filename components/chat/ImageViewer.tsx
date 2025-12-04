"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "antd";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

interface ImageViewerProps {
  open: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageViewer({
  open,
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      centered
      closeIcon={<CloseOutlined className="text-white text-xl" />}
      modalRender={(modal) => (
        <div
          className="relative"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
        >
          {modal}
        </div>
      )}
      styles={{
        body: { padding: 0, background: "transparent" },
        content: { background: "transparent", boxShadow: "none" },
      }}
    >
      <div className="relative flex items-center justify-center min-h-[60vh]">
        {/* Main image */}
        <div className="relative max-w-full max-h-[80vh]">
          <Image
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            width={1200}
            height={800}
            className="w-auto h-auto max-w-full max-h-[80vh] object-contain"
            unoptimized
          />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <LeftOutlined className="text-xl" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
              aria-label="Next image"
            >
              <RightOutlined className="text-xl" />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-blue-500 scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
