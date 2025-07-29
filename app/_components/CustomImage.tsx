"use client";

import Image from "next/image";
import { useState } from "react";

interface CustomImageProps {
  src: string;
  alt?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
}

const CustomImage = ({ src, alt, objectFit }: CustomImageProps) => {
  const [loading, setLoading] = useState(true);

  const getThumbnailUrl = (originalSrc: string): string => {
    const lastDotIndex = originalSrc.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return `${originalSrc}-thumbnail`;
    }

    const baseUrl = originalSrc.substring(0, lastDotIndex);
    const extension = originalSrc.substring(lastDotIndex);

    return `${baseUrl}-thumbnail${extension}`;
  };

  return (
    <div
      className="relative w-full h-full"
      style={{
        isolation: "isolate", // Yeni stacking context oluştur
        contain: "layout style paint", // CSS containment
      }}
    >
      {/* Thumbnail (blurred background) */}
      <Image
        fill
        priority
        unoptimized
        alt={alt || "Thumbnail"}
        src={getThumbnailUrl(src)}
        style={{
          objectFit: objectFit,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
        className={`transition-opacity duration-300 ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      />

      <Image
        fill
        unoptimized
        alt={`${alt}-real-image`}
        src={src}
        style={{
          objectFit: objectFit,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
        }}
        onLoad={() => setLoading(false)}
        className={`transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
};

export default CustomImage;
