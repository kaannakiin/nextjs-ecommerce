"use server";

import {
  DeleteObject,
  uploadFileToMinio,
} from "@/actions/helper-actions/minio-actions";
import prisma from "@/lib/prisma";
import { Brand, BrandSchema } from "@/schemas/product-schema";
import { ActionResponse } from "@/types/globalTypes";
import { treeifyError } from "zod";

export async function BrandAction(formData: Brand): Promise<ActionResponse> {
  try {
    const { success, data, error } = BrandSchema.safeParse(formData);
    if (!success) {
      return {
        success: false,
        message: treeifyError(error)
          .errors.map((err) => err)
          .join(", "),
      };
    }

    const urls = data.image
      ? await uploadFileToMinio({
          bucketName: "product-assets",
          file: data.image,
          isNeedOg: true,
          isNeedThumbnail: true,
        })
      : null;

    if (data.uniqueId) {
      // Güncelleme işlemi
      const existingBrand = await prisma.productBrand.findUnique({
        where: { id: data.uniqueId },
        include: {
          image: true,
          translations: true,
        },
      });

      if (!existingBrand) {
        return { success: false, message: "Marka bulunamadı" };
      }

      // Eski resmi sil
      if (existingBrand.image && urls) {
        await DeleteObject({ url: existingBrand.image.url });
      }

      // Asset oluştur/güncelle
      let assetId = existingBrand.imageId;
      if (urls) {
        const asset = await prisma.asset.upsert({
          where: { url: urls.data?.originalUrl },
          update: { url: urls.data?.originalUrl },
          create: {
            type: "IMAGE",
            url: urls.data?.originalUrl
              ? urls.data?.originalUrl
              : existingBrand.image?.url || "",
          },
        });
        assetId = asset.id;
      }

      // Brand'i güncelle
      await prisma.productBrand.update({
        where: { id: data.uniqueId },
        data: {
          imageId: assetId,
          updatedAt: new Date(),
        },
      });

      // Translation'ları kontrol et ve sadece değişenleri güncelle
      if (data.translations) {
        for (const newTranslation of data.translations) {
          const existingTranslation = existingBrand.translations.find(
            (t) => t.locale === newTranslation.locale
          );

          if (existingTranslation) {
            // Slug değişip değişmediğini kontrol et
            const slugChanged =
              existingTranslation.slug !== newTranslation.slug;

            if (slugChanged) {
              // Slug değiştiyse normal update yap
              await prisma.productBrandTranslation.update({
                where: { id: existingTranslation.id },
                data: {
                  name: newTranslation.name,
                  slug: newTranslation.slug,
                  description: newTranslation.description,
                  metaTitle: newTranslation.metaTitle,
                  metaDescription: newTranslation.metaDescription,
                  updatedAt: new Date(),
                },
              });
            } else {
              // Slug değişmediyse slug hariç güncelle
              await prisma.productBrandTranslation.update({
                where: { id: existingTranslation.id },
                data: {
                  name: newTranslation.name,
                  description: newTranslation.description,
                  metaTitle: newTranslation.metaTitle,
                  metaDescription: newTranslation.metaDescription,
                  updatedAt: new Date(),
                  // slug'ı dahil etme!
                },
              });
            }
          } else {
            // Yeni translation oluştur
            await prisma.productBrandTranslation.create({
              data: {
                locale: newTranslation.locale,
                name: newTranslation.name,
                slug: newTranslation.slug,
                description: newTranslation.description,
                metaTitle: newTranslation.metaTitle,
                metaDescription: newTranslation.metaDescription,
                brandId: data.uniqueId,
              },
            });
          }
        }
      }
    } else {
      let assetId = null;
      if (urls) {
        const asset = await prisma.asset.create({
          data: {
            type: "IMAGE",
            url: urls.data?.originalUrl ? urls.data?.originalUrl : "",
          },
        });
        assetId = asset.id;
      }

      const newBrand = await prisma.productBrand.create({
        data: {
          imageId: assetId,
        },
      });

      if (data.translations) {
        await prisma.productBrandTranslation.createMany({
          data: data.translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
            description: translation.description,
            metaTitle: translation.metaTitle,
            metaDescription: translation.metaDescription,
            brandId: newBrand.id,
          })),
        });
      }
    }

    return {
      success: true,
      message: "Brand başarıyla işlendi",
    };
  } catch (error) {
    console.error("Brand action error:", error);
    return {
      success: false,
      message: "Bir hata oluştu",
    };
  }
}
