"use server";

import { DeleteImage } from "@/actions/helper-actions/delete-image";
import { uploadFileToMinio } from "@/actions/helper-actions/minio-actions";
import { checkRolesForActions } from "@/lib/checkRoles";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { Category, CategorySchema } from "@/schemas/product-schema";
import { ActionResponse } from "@/types/globalTypes";
import { treeifyError } from "zod";

export async function CategoryAction(
  formData: Category
): Promise<ActionResponse> {
  try {
    const { success, data, error } = CategorySchema.safeParse(formData);
    if (!success) {
      return {
        success: false,
        message: treeifyError(error)
          .errors.map((err) => err)
          .join(", "),
      };
    }
    if (!(await checkRolesForActions("admin_owner"))) {
      return {
        success: false,
        message: "You do not have permission to perform this action.",
      };
    }

    if (formData.uniqueId) {
      // GÜNCELLEME İŞLEMİ
      const category = await prisma.category.findUnique({
        where: { id: formData.uniqueId },
        include: {
          image: true,
          translations: true, // Mevcut translation'ları da getir
        },
      });

      if (!category) {
        return {
          success: false,
          message: "Kategori bulunamadı.",
        };
      }

      // Slug benzersizlik kontrolü - sadece BAŞKA kategorilerde kontrol et
      for (const translation of formData.translations) {
        const translationExists = await prisma.categoryTranslation.findUnique({
          where: {
            locale_slug: {
              locale: translation.locale,
              slug: slugify(translation.slug || translation.name),
            },
          },
        });

        // Eğer başka bir kategori bu slug'ı kullanıyorsa hata ver
        if (
          translationExists &&
          translationExists.categoryId !== formData.uniqueId
        ) {
          return {
            success: false,
            message: `"${slugify(
              translation.slug || translation.name
            )}" slug'ı ${
              translation.locale
            } dilinde başka bir kategori tarafından kullanılıyor. Lütfen farklı bir slug kullanın.`,
          };
        }
      }

      // Resim yükleme
      const urls = formData.image
        ? await uploadFileToMinio({
            bucketName: "category-assets",
            file: formData.image,
            isNeedOg: true,
            isNeedThumbnail: true,
          })
        : null;

      // Eski resmi sil
      if (category.imageId && category.image) {
        await DeleteImage({
          url: category.image.url,
        });
      }

      // Kategoriyi güncelle
      const updatedCategory = await prisma.category.update({
        where: { id: formData.uniqueId },
        data: {
          ...(urls &&
            urls.success &&
            urls.data?.originalUrl && {
              image: {
                create: {
                  url: urls.data.originalUrl,
                  type: formData.image?.type.startsWith("image/")
                    ? "IMAGE"
                    : formData.image?.type.startsWith("video/")
                    ? "VIDEO"
                    : "DOCUMENT",
                },
              },
            }),
          translations: {
            // Önce mevcut translation'ları sil, sonra yenilerini oluştur
            deleteMany: {
              categoryId: formData.uniqueId,
            },
            create: formData.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              description: translation.description,
              slug: slugify(translation.slug || translation.name),
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
            })),
          },
        },
      });

      return {
        success: true,
        message: "Kategori başarıyla güncellendi.",
      };
    } else {
      // YENİ OLUŞTURMA İŞLEMİ

      // Slug benzersizlik kontrolü - tüm kategorilerde kontrol et
      for (const translation of formData.translations) {
        const categoryIsCreatable = await prisma.categoryTranslation.findUnique(
          {
            where: {
              locale_slug: {
                locale: translation.locale,
                slug: slugify(translation.slug || translation.name),
              },
            },
          }
        );

        if (categoryIsCreatable) {
          return {
            success: false,
            message: `"${slugify(
              translation.slug || translation.name
            )}" slug'ı ${
              translation.locale
            } dilinde zaten mevcut. Lütfen farklı bir slug kullanın.`,
          };
        }
      }

      // Resim yükleme
      const urls = formData.image
        ? await uploadFileToMinio({
            bucketName: "category-assets",
            file: formData.image,
            isNeedOg: true,
            isNeedThumbnail: true,
          })
        : null;

      // Yeni kategori oluştur
      const createdCategory = await prisma.category.create({
        data: {
          ...(urls &&
            urls.success &&
            urls.data?.originalUrl && {
              image: {
                create: {
                  url: urls.data.originalUrl,
                  type: formData.image?.type.startsWith("image/")
                    ? "IMAGE"
                    : formData.image?.type.startsWith("video/")
                    ? "VIDEO"
                    : "DOCUMENT",
                },
              },
            }),
          ...(formData.parentCategoryId && {
            parentCategory: {
              connect: {
                id: formData.parentCategoryId,
              },
            },
          }),
          translations: {
            create: formData.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              description: translation.description,
              slug: slugify(translation.slug || translation.name),
              metaTitle: translation.metaTitle,
              metaDescription: translation.metaDescription,
            })),
          },
        },
      });

      return {
        success: true,
        message: "Kategori başarıyla oluşturuldu.",
      };
    }
  } catch (error) {
    console.error("CategoryAction error:", error);
    return {
      success: false,
      message: "Kategori işlemi sırasında bir hata oluştu.",
    };
  }
}
