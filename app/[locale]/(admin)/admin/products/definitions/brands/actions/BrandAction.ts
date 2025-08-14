"use server";

import {
  DeleteObject,
  uploadFileToMinio,
} from "@/actions/helper-actions/minio-actions";
import prisma from "@/lib/prisma";
import { Brand, BrandSchema } from "@/schemas/product-schema";
import { ActionResponse } from "@/types/globalTypes";
import { treeifyError } from "zod";

const getReadableErrorMessage = (error: any): string => {
  if (error?.code === "P2002") {
    return "Bu marka adı veya slug zaten kullanılmakta. Lütfen farklı bir isim deneyin.";
  }

  if (error?.code === "P2025") {
    return "Güncellenmek istenen marka bulunamadı.";
  }

  if (error?.code === "P2003") {
    return "Seçilen ebeveyn marka geçerli değil.";
  }

  if (error?.message?.includes("Foreign key constraint")) {
    return "İlişkili veriler nedeniyle işlem gerçekleştirilemedi.";
  }

  if (error?.message?.includes("Unique constraint")) {
    return "Bu bilgiler zaten sistemde mevcut. Lütfen farklı bilgiler girin.";
  }

  if (error?.message?.includes("upload") || error?.message?.includes("minio")) {
    return "Resim yüklenirken bir hata oluştu. Lütfen farklı bir resim deneyin.";
  }

  if (
    error?.message?.includes("network") ||
    error?.message?.includes("timeout")
  ) {
    return "Bağlantı sorunu yaşandı. Lütfen internet bağlantınızı kontrol edin.";
  }

  return "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
};

export async function BrandAction(formData: Brand): Promise<ActionResponse> {
  try {
    // Form validasyonu
    const { success, data, error } = BrandSchema.safeParse(formData);
    if (!success) {
      const errorMessages = treeifyError(error)
        .errors.map((err) => err)
        .join(", ");

      return {
        success: false,
        message: `Form hataları: ${errorMessages}`,
      };
    }

    // Resim yükleme işlemi
    let urls = null;
    if (data.image) {
      try {
        urls = await uploadFileToMinio({
          bucketName: "product-assets",
          file: data.image,
          isNeedOg: true,
          isNeedThumbnail: true,
        });

        if (!urls || !urls.success) {
          return {
            success: false,
            message:
              "Resim yüklenirken bir hata oluştu. Lütfen farklı bir resim deneyin.",
          };
        }
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        return {
          success: false,
          message:
            "Resim yüklenirken bir hata oluştu. Dosya boyutunuzu kontrol edin.",
        };
      }
    }

    if (data.uniqueId) {
      // Güncelleme işlemi
      try {
        const existingBrand = await prisma.productBrand.findUnique({
          where: { id: data.uniqueId },
          include: {
            image: true,
            translations: true,
          },
        });

        if (!existingBrand) {
          return {
            success: false,
            message:
              "Güncellenecek marka bulunamadı. Sayfa yenilenerek tekrar deneyin.",
          };
        }

        // Slug çakışması kontrolü
        if (data.translations) {
          for (const translation of data.translations) {
            const slugConflict = await prisma.productBrandTranslation.findFirst(
              {
                where: {
                  slug: translation.slug,
                  locale: translation.locale,
                  brandId: { not: data.uniqueId },
                },
              }
            );

            if (slugConflict) {
              return {
                success: false,
                message: `"${translation.slug}" slug'ı zaten başka bir marka tarafından kullanılmakta.`,
              };
            }
          }
        }

        // Eski resmi sil
        if (existingBrand.image && urls) {
          try {
            await DeleteObject({ url: existingBrand.image.url });
          } catch (deleteError) {
            console.warn("Old image deletion failed:", deleteError);
            // Eski resim silinmese de devam et
          }
        }

        let assetId = existingBrand.imageId;
        if (urls) {
          const asset = await prisma.asset.upsert({
            where: { url: urls.data?.originalUrl },
            update: { url: urls.data?.originalUrl },
            create: {
              type: "IMAGE",
              url: urls.data?.originalUrl || existingBrand.image?.url || "",
            },
          });
          assetId = asset.id;
        }

        await prisma.productBrand.update({
          where: { id: data.uniqueId },
          data: {
            imageId: assetId,
            ...(data.parentBrandId && { parentBrandId: data.parentBrandId }),
          },
        });

        // Çeviri güncelleme
        if (data.translations) {
          for (const newTranslation of data.translations) {
            const existingTranslation = existingBrand.translations.find(
              (t) => t.locale === newTranslation.locale
            );

            if (existingTranslation) {
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

        return {
          success: true,
          message: "Marka başarıyla güncellendi.",
        };
      } catch (updateError) {
        console.error("Brand update error:", updateError);
        return {
          success: false,
          message: getReadableErrorMessage(updateError),
        };
      }
    } else {
      // Yeni marka oluşturma
      try {
        // Slug çakışması kontrolü
        if (data.translations) {
          for (const translation of data.translations) {
            const slugConflict = await prisma.productBrandTranslation.findFirst(
              {
                where: {
                  slug: translation.slug,
                  locale: translation.locale,
                },
              }
            );

            if (slugConflict) {
              return {
                success: false,
                message: `"${translation.slug}" slug'ı zaten kullanılmakta. Farklı bir marka adı deneyin.`,
              };
            }
          }
        }

        let assetId = null;
        if (urls) {
          const asset = await prisma.asset.create({
            data: {
              type: "IMAGE",
              url: urls.data?.originalUrl || "",
            },
          });
          assetId = asset.id;
        }

        const newBrand = await prisma.productBrand.create({
          data: {
            imageId: assetId,
            ...(data.parentBrandId && { parentBrandId: data.parentBrandId }),
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

        return {
          success: true,
          message: "Marka başarıyla oluşturuldu.",
        };
      } catch (createError) {
        console.error("Brand creation error:", createError);
        return {
          success: false,
          message: getReadableErrorMessage(createError),
        };
      }
    }
  } catch (error) {
    console.error("Brand action error:", error);
    return {
      success: false,
      message: getReadableErrorMessage(error),
    };
  }
}
