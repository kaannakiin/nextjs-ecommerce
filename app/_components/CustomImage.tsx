"use client";

import Image from "next/image";
import { useState } from "react";

interface CustomImageProps {
  src: string;
  alt?: string;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  renderThumbnail?: boolean; // Yeni prop
}

const CustomImage = ({
  src,
  alt,
  objectFit = "cover",
  renderThumbnail = true,
}: CustomImageProps) => {
  const [loading, setLoading] = useState(renderThumbnail); // Thumbnail yoksa loading başlangıçta false

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
        isolation: "isolate",
        contain: "layout style paint",
      }}
    >
      {/* Conditional Thumbnail Rendering */}
      {renderThumbnail && (
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
      )}

      {/* Main Image */}
      <Image
        fill
        unoptimized
        alt={alt || "Main image"}
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
        priority={!renderThumbnail}
      />
    </div>
  );
};

export default CustomImage;
