"use client";

import {
  ActionIcon,
  AspectRatio,
  Image as MantineImage,
  Modal,
  Transition,
} from "@mantine/core";
import { IconZoomIn } from "@tabler/icons-react";
import { useState, useRef } from "react";

interface TableImageProps {
  url: string | null;
  alt?: string;
  onImageClick?: () => void; // ⭐ YENİ prop
}

const TableImage = ({
  url,
  alt = "Product Image",
  onImageClick,
}: TableImageProps) => {
  const [opened, setOpened] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null); // ⭐ Ref ekle

  // Eğer URL null ise sadece placeholder göster
  if (!url) {
    return (
      <AspectRatio ratio={1}>
        <MantineImage
          src={null}
          radius="md"
          alt={alt}
          fallbackSrc="https://placehold.co/600x600?text=Resim+Yok"
        />
      </AspectRatio>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onImageClick) {
      onImageClick();
    }

    setOpened(true);
  };

  return (
    <>
      <AspectRatio
        ref={containerRef}
        ratio={1}
        pos="relative"
        style={{ cursor: "pointer", zIndex: 100 }} // ⭐ yüksek z-index
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()} // ⭐ mousedown'ı da engelle
      >
        <MantineImage
          src={url}
          radius="md"
          alt={alt}
          fallbackSrc="https://placehold.co/600x600?text=Resim+Yüklenemedi"
          style={{ pointerEvents: "none" }} // ⭐ Image'ın kendi event'lerini engelle
        />

        {/* Büyüteç ikonu - sadece hover'da görünür */}
        <Transition
          mounted={isHovered}
          transition="fade"
          duration={200}
          timingFunction="ease"
        >
          {(styles) => (
            <ActionIcon
              style={{
                ...styles,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                color: "white",
                zIndex: 101,
                pointerEvents: "none",
              }}
              size="lg"
              radius="xl"
            >
              <IconZoomIn size={20} />
            </ActionIcon>
          )}
        </Transition>

        {/* Hover overlay */}
        <Transition mounted={isHovered} transition="fade" duration={200}>
          {(styles) => (
            <div
              style={{
                ...styles,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderRadius: "var(--mantine-radius-md)",
                pointerEvents: "none",
              }}
            />
          )}
        </Transition>
      </AspectRatio>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        size="auto"
        centered
        withCloseButton={false}
        padding="md"
        styles={{
          body: {
            padding: 0,
          },
          content: {
            maxWidth: "90vw",
            maxHeight: "90vh",
          },
        }}
      >
        <div
          style={{
            maxWidth: "80vw",
            maxHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MantineImage
            src={url}
            alt={alt}
            fit="contain"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            fallbackSrc="https://placehold.co/600x600?text=Resim+Yüklenemedi"
          />
        </div>
      </Modal>
    </>
  );
};

export default TableImage;
