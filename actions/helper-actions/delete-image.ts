"use server";

import { Prisma } from "@/app/generated/prisma";
import { ActionResponse } from "@/types/globalTypes";
import { DeleteObject } from "./minio-actions";
import prisma from "@/lib/prisma";

interface DeleteImageProps {
  url: string;
}
export async function DeleteImage({
  ...props
}: DeleteImageProps): Promise<ActionResponse> {
  try {
    const response = await DeleteObject({ url: props.url });
    if (!response.success) {
      return {
        success: false,
        message: "Resim silme işlemi başarısız.",
      };
    }
    const image = await prisma.asset.delete({
      where: {
        url: props.url,
      },
    });
    if (!image) {
      return {
        success: false,
        message: "Resim bulunamadı.",
      };
    }
    return {
      success: true,
      message: "Resim başarıyla silindi.",
    };
  } catch (error) {
    console.error("Error deleting image:", error);
    return {
      success: false,
      message: "Resim silme işlemi sırasında bir hata oluştu.",
    };
  }
}
