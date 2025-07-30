"use client";

import CustomImage from "@/app/_components/CustomImage";
import { AssetType } from "@/app/generated/prisma";
import { getAssetTypeLabel } from "@/lib/helper";
import { ActionResponse } from "@/types/globalTypes";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTrashFilled, IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import GlobalLoadingOverlay from "./GlobalLoadingOverlay";

interface ObjectDeleteModalProps {
  url: string;
  type: AssetType;
  onDelete?: () => Promise<ActionResponse>;
  renderThumbnail?: boolean; // Yeni prop
}

const ObjectDeleteModal = ({
  url,
  type,
  onDelete,
  renderThumbnail = true, // Yeni prop varsayılan değeri
}: ObjectDeleteModalProps) => {
  const [opened, { open, close }] = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Error mesajını 3 saniye sonra temizle
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Modal kapandığında state'leri temizle
  const handleClose = () => {
    if (!loading) {
      setErrorMessage("");
      close();
    }
  };

  const handleDelete = async () => {
    if (!onDelete || loading) return;

    setLoading(true);
    setErrorMessage(""); // Önceki hataları temizle

    try {
      const response = await onDelete();

      if (response.success) {
        close();
        // Modal kapandıktan sonra state'leri temizle
        setTimeout(() => {
          setErrorMessage("");
        }, 100);
      } else {
        setErrorMessage(response.message || "Silme işlemi başarısız.");
      }
    } catch (error) {
      console.error("Error deleting object:", error);
      setErrorMessage("Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalLoadingOverlay visible={loading} />

      <div className={`size-12 relative group`}>
        <div className="absolute inset-0">
          {type === "IMAGE" ? (
            <CustomImage
              src={url}
              objectFit="contain"
              renderThumbnail={renderThumbnail}
            />
          ) : type === "VIDEO" ? (
            <video
              src={url}
              style={{
                objectFit: "contain",
              }}
              className="w-full h-full"
            />
          ) : null}
        </div>

        <div className="relative z-[999] w-full h-full pointer-events-none">
          <ActionIcon
            size="md"
            radius="md"
            variant="filled"
            color="red"
            onClick={open}
            className="absolute top-1 right-1 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              zIndex: 999,
              pointerEvents: "auto",
            }}
          >
            <IconTrashFilled size={20} />
          </ActionIcon>
        </div>
      </div>

      <Modal
        opened={opened}
        onClose={handleClose}
        centered
        withCloseButton={false} // Loading sırasında X butonunu gizle
        radius="md"
        closeOnClickOutside={!loading} // Loading sırasında dışarı tıklayarak kapatmayı engelle
        closeOnEscape={!loading} // Loading sırasında ESC ile kapatmayı engelle
      >
        <Stack gap="xl">
          <Text fz="md" fw={700}>
            {getAssetTypeLabel(type)} silmek istediğinize emin misiniz?
          </Text>

          {errorMessage && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              radius="md"
            >
              {errorMessage}
            </Alert>
          )}

          <Group justify="end" gap="xs">
            <Button variant="light" onClick={handleClose} disabled={loading}>
              İptal
            </Button>
            <Button
              variant="filled"
              color="red"
              onClick={handleDelete}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Siliniyor..." : "Sil"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default ObjectDeleteModal;
