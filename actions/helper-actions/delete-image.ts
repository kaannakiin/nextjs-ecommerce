"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/types/globalTypes";
import { DeleteObject } from "./minio-actions";

interface DeleteImageProps {
  url: string;
  deleteAsset?: boolean; // Default true
}

// 🎯 ANA FONKSİYON: DeleteImage
export async function DeleteImage({
  url,
  deleteAsset = true,
}: DeleteImageProps): Promise<ActionResponse> {
  try {
    // 1. Minio'dan sil
    const minioResponse = await DeleteObject({ url });
    if (!minioResponse.success) {
      return {
        success: false,
        message: "Resim cloud'dan silme işlemi başarısız.",
      };
    }

    // 2. Eğer deleteAsset true ise veritabanından da sil
    if (deleteAsset) {
      const asset = await prisma.asset.findUnique({
        where: { url },
      });

      if (!asset) {
        return {
          success: false,
          message: "Resim veritabanında bulunamadı.",
        };
      }

      await prisma.asset.delete({
        where: { id: asset.id },
      });

      return {
        success: true,
        message: "Resim tamamen silindi.",
      };
    }

    return {
      success: true,
      message: "Resim cloud'dan silindi.",
    };
  } catch (error) {
    console.error("❌ Error deleting image:", error);
    return {
      success: false,
      message: "Resim silme işlemi sırasında bir hata oluştu.",
    };
  }
}
