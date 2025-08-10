"use server";

import { DeleteImage } from "@/actions/helper-actions/delete-image";
import {
  DeleteObject,
  uploadFileToMinio,
} from "@/actions/helper-actions/minio-actions";
import { Asset, Currency } from "@/app/generated/prisma";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { VariantProduct } from "@/schemas/product-schema";
import { ActionResponse } from "@/types/globalTypes";

async function createOrUpdateVariantOption(
  variantId: string,
  option: VariantProduct["selectedVariants"][0]["options"][0],
  tx: any
): Promise<{ variantOption: any; oldImageUrl: string | null }> {
  const uploadedImage = option.image
    ? await uploadFileToMinio({
        bucketName: "variant-images",
        file: option.image,
        isNeedOg: false,
        isNeedThumbnail: true,
      })
    : null;

  if (option.image && (!uploadedImage?.success || !uploadedImage.data)) {
    throw new Error(`Resim yüklenirken hata: ${uploadedImage?.message}`);
  }

  const optionValue =
    option.translations.find((t) => t.locale === "TR")?.name || "";

  // İlk önce upsert işlemini yapalım
  const variantOption = await tx.variantOption.upsert({
    where: {
      variantId_value: {
        variantId,
        value: optionValue,
      },
    },
    include: { image: true },
    create: {
      variantId,
      value: optionValue,
      colorHex: option.value || null,
      translations: {
        createMany: {
          data: option.translations.map((translation) => ({
            name: translation.name,
            slug: slugify(translation.name),
            locale: translation.locale,
          })),
        },
      },
      ...(uploadedImage?.data && {
        image: {
          create: {
            url: uploadedImage.data.originalUrl,
            type: "IMAGE",
          },
        },
      }),
    },
    update: {
      colorHex: option.value || null,
      translations: {
        deleteMany: {}, // Önce mevcut çevirileri sil
        createMany: {
          data: option.translations.map((translation) => ({
            name: translation.name,
            slug: slugify(translation.name),
            locale: translation.locale,
          })),
        },
      },
    },
  });

  // Eğer yeni resim varsa ve eski resim varsa, eski resmi sil
  let oldImageUrl: string | null = null;
  if (uploadedImage?.data && variantOption.image) {
    oldImageUrl = variantOption.image.url;

    await tx.variantOption.update({
      where: { id: variantOption.id },
      data: { image: { disconnect: true } },
    });

    // Asset kullanım kontrolü
    const assetUsageCount = await tx.productAsset.count({
      where: { assetId: variantOption.image.id },
    });

    const otherVariantUsageCount = await tx.variantOption.count({
      where: {
        imageId: variantOption.image.id,
        id: { not: variantOption.id },
      },
    });

    if (assetUsageCount === 0 && otherVariantUsageCount === 0) {
      await tx.asset.delete({
        where: { id: variantOption.image.id },
      });
    }

    // Yeni resmi bağla
    await tx.variantOption.update({
      where: { id: variantOption.id },
      data: {
        image: {
          create: {
            url: uploadedImage.data.originalUrl,
            type: "IMAGE",
          },
        },
      },
    });
  }

  // Eğer update işlemi yapıldıysa ve translations güncellenmesi gerekiyorsa
  if (option.uniqueId) {
    // Mevcut çevirileri güncelle
    for (const translation of option.translations) {
      await tx.variantOptionTranslation.upsert({
        where: {
          locale_variantOptionId: {
            locale: translation.locale,
            variantOptionId: variantOption.id,
          },
        },
        create: {
          locale: translation.locale,
          name: translation.name,
          slug: slugify(translation.name),
          variantOptionId: variantOption.id,
        },
        update: {
          name: translation.name,
          slug: slugify(translation.name),
        },
      });
    }
  }

  return { variantOption, oldImageUrl };
}

export async function CreateOrUpdateVariantAndOptions(
  variantData: VariantProduct["selectedVariants"][0],
  productId?: string // ⭐ YENİ parametre - ürün güncelleniyorsa kombinasyonları temizle
): Promise<ActionResponse & { variantId?: string }> {
  const oldImagesToDelete: string[] = [];

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // Variant oluştur/güncelle (önce variant'ı oluştur)
        const variant = await tx.variant.upsert({
          where: { id: variantData.uniqueId || "non-existent-id" },
          create: {
            type: variantData.type,
            translations: {
              createMany: {
                data: variantData.translations.map((translation) => ({
                  name: translation.name,
                  slug: slugify(translation.name),
                  locale: translation.locale,
                })),
              },
            },
          },
          update: {
            type: variantData.type,
            translations: {
              upsert: variantData.translations.map((translation) => ({
                where: {
                  locale_variantId: {
                    locale: translation.locale,
                    variantId: variantData.uniqueId || "non-existent-id",
                  },
                },
                create: {
                  name: translation.name,
                  slug: slugify(translation.name),
                  locale: translation.locale,
                },
                update: {
                  name: translation.name,
                  slug: slugify(translation.name),
                },
              })),
            },
          },
        });

        // ⭐ YENİ: Eğer productId verilmişse, o ürünün kombinasyonlarını ve ilgili option'ları temizle
        if (productId) {
          // 1. Kombinasyonları sil
          await tx.productVariantCombination.deleteMany({
            where: { productId },
          });

          // 2. ProductVariantGroupOption'ları temizle (BU EKLENDİ! 🎯)
          const productVariantGroups = await tx.productVariantGroup.findMany({
            where: { productId },
          });

          for (const group of productVariantGroups) {
            await tx.productVariantGroupOption.deleteMany({
              where: { productVariantGroupId: group.id },
            });
          }

          // 3. Mevcut option'ları al ve temizle
          const existingOptions = await tx.variantOption.findMany({
            where: { variantId: variant.id },
          });

          // Form'dan gelen option ID'lerini topla
          const formOptionIds = variantData.options
            .map((opt) => opt.uniqueId)
            .filter(Boolean);

          // Silinmesi gereken option'ları bul
          const optionsToDelete = existingOptions.filter(
            (existing) => !formOptionIds.includes(existing.id)
          );

          // Kullanılmayan option'ları sil
          for (const optionToDelete of optionsToDelete) {
            // Kullanım kontrolü (artık ProductVariantGroupOption'lar temizlendiği için bu kontroller daha güvenli)
            const usageCount = await tx.productVariantCombinationOption.count({
              where: { variantOptionId: optionToDelete.id },
            });

            const groupUsageCount = await tx.productVariantGroupOption.count({
              where: { variantOptionId: optionToDelete.id },
            });

            if (usageCount === 0 && groupUsageCount === 0) {
              // Resmi varsa sil
              if (optionToDelete.imageId) {
                const asset = await tx.asset.findUnique({
                  where: { id: optionToDelete.imageId },
                });
                if (asset) {
                  oldImagesToDelete.push(asset.url);
                }
              }

              // Option'ı sil
              await tx.variantOption.delete({
                where: { id: optionToDelete.id },
              });
            }
          }
        }

        // VariantOption'ları işle
        for (const option of variantData.options) {
          const { oldImageUrl } = await createOrUpdateVariantOption(
            variant.id,
            option,
            tx
          );
          if (oldImageUrl) {
            oldImagesToDelete.push(oldImageUrl);
          }
        }

        return variant;
      },
      {
        timeout: 60000,
      }
    );

    // Eski resimleri sil
    for (const imageUrl of oldImagesToDelete) {
      await DeleteImage({ url: imageUrl });
    }

    return {
      success: true,
      message: variantData.uniqueId
        ? "Variant başarıyla güncellendi"
        : "Variant başarıyla oluşturuldu",
      variantId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `Variant işlemi başarısız: ${error.message}`
          : "Beklenmeyen bir hata oluştu",
    };
  }
}
export async function CreateProductVariantGroups(
  productId: string,
  variantIds: string[]
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(
      async (tx) => {
        // Mevcut grupları sil (eğer güncelleme ise)
        await tx.productVariantGroup.deleteMany({
          where: { productId },
        });

        // Yeni grupları oluştur
        for (let i = 0; i < variantIds.length; i++) {
          await tx.productVariantGroup.create({
            data: {
              productId,
              variantId: variantIds[i],
              order: i,
            },
          });
        }
      },
      { timeout: 60000 }
    );

    return {
      success: true,
      message: "Ürün variant grupları başarıyla oluşturuldu",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `Variant grup işlemi başarısız: ${error.message}`
          : "Beklenmeyen bir hata oluştu",
    };
  }
}

export async function SetProductVariantAvailableOptions(
  productId: string,
  variantGroupsWithOptions: Array<{
    variantId: string;
    optionIds: string[];
  }>
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(
      async (tx) => {
        // Mevcut available options'ları sil
        const existingGroups = await tx.productVariantGroup.findMany({
          where: { productId },
          include: { availableOptions: true },
        });

        for (const group of existingGroups) {
          await tx.productVariantGroupOption.deleteMany({
            where: { productVariantGroupId: group.id },
          });
        }

        await tx.productVariantCombination.deleteMany({
          where: { productId },
        });
        // Yeni available options'ları ekle
        for (const variantGroup of variantGroupsWithOptions) {
          const productVariantGroup = await tx.productVariantGroup.findFirst({
            where: {
              productId,
              variantId: variantGroup.variantId,
            },
          });

          if (!productVariantGroup) {
            throw new Error(
              `Variant grubu bulunamadı: ${variantGroup.variantId}`
            );
          }

          for (let i = 0; i < variantGroup.optionIds.length; i++) {
            const optionId = variantGroup.optionIds[i];

            // Option'ın gerçekten var olduğunu kontrol et
            const variantOptionExists = await tx.variantOption.findUnique({
              where: { id: optionId },
            });

            if (!variantOptionExists) {
              continue;
            }

            await tx.productVariantGroupOption.create({
              data: {
                productVariantGroupId: productVariantGroup.id,
                variantOptionId: optionId,
                sortOrder: i,
              },
            });
          }
        }
      },
      { timeout: 60000 }
    );

    return {
      success: true,
      message: "Ürün variant seçenekleri başarıyla ayarlandı",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? `Variant seçenekleri ayarlama başarısız: ${error.message}`
          : "Beklenmeyen bir hata oluştu",
    };
  }
}

export async function CreateProductVariantCombinations(
  productId: string,
  combinations: VariantProduct["variants"]
): Promise<ActionResponse> {
  const uploadedImageUrls: string[] = [];

  try {
    await prisma.$transaction(
      async (tx) => {
        // Mevcut kombinasyonları sil
        await tx.productVariantCombination.deleteMany({
          where: { productId },
        });

        // Ürününvariant gruplarını al
        const productVariantGroups = await tx.productVariantGroup.findMany({
          where: { productId },
          include: { variant: true },
          orderBy: { order: "asc" },
        });

        for (let combIndex = 0; combIndex < combinations.length; combIndex++) {
          const combination = combinations[combIndex];

          // Kombinasyon oluştur
          const createdCombination = await tx.productVariantCombination.create({
            data: {
              productId,
              sku: combination.sku,
              stock: combination.stock,
              barcode: combination.barcode,
            },
          });

          // Kombinasyon option'larını bağla
          for (let i = 0; i < combination.options.length; i++) {
            const optionId = combination.options[i].variantOptionId;
            const productVariantGroup = productVariantGroups[i];

            if (!productVariantGroup) {
              throw new Error(
                `Variant grubu bulunamadı: index ${i}, productId: ${productId}`
              );
            }

            await tx.productVariantCombinationOption.create({
              data: {
                combinationId: createdCombination.id,
                productVariantGroupId: productVariantGroup.id,
                variantOptionId: optionId,
              },
            });
          }

          // Kombinasyon fiyatlarını oluştur
          for (const price of combination.prices) {
            await tx.productVariantCombinationPrice.create({
              data: {
                combinationId: createdCombination.id,
                currency: price.currency,
                price: price.price,
                discountedPrice: price.discountedPrice,
                buyedPrice: price.buyedPrice,
              },
            });
          }

          // Kombinasyon çevirilerini oluştur
          for (const translation of combination.translations) {
            await tx.productVariantCombinationTranslation.create({
              data: {
                combinationId: createdCombination.id,
                locale: translation.locale,
                description: translation.description,
                shortDescription: translation.shortDescription,
                metaTitle: translation.metaTitle,
                metaDescription: translation.metaDescription,
              },
            });
          }

          // Kombinasyon resimlerini yükle
          if (combination.images && combination.images.length > 0) {
            for (let i = 0; i < combination.images.length; i++) {
              const image = combination.images[i];
              const uploadedImage = await uploadFileToMinio({
                bucketName: "product-images",
                file: image,
                isNeedOg: true,
                isNeedThumbnail: true,
              });

              if (uploadedImage.success && uploadedImage.data) {
                uploadedImageUrls.push(uploadedImage.data.originalUrl);

                const asset = await tx.asset.create({
                  data: {
                    url: uploadedImage.data.originalUrl,
                    type: "IMAGE",
                  },
                });

                await tx.productVariantImage.create({
                  data: {
                    combinationId: createdCombination.id,
                    assetId: asset.id,
                    order: i,
                  },
                });
              }
            }
          }
        }
      },
      { timeout: 60000 }
    );

    return {
      success: true,
      message: "Variant kombinasyonları başarıyla oluşturuldu",
    };
  } catch (error) {
    // Hata durumunda yüklenen resimleri temizle
    for (const imageUrl of uploadedImageUrls) {
      await DeleteImage({ url: imageUrl });
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? `Kombinasyon oluşturma başarısız: ${error.message}`
          : "Beklenmeyen bir hata oluştu",
    };
  }
}

export async function CreateOrUpdateVariantProduct(
  formData: VariantProduct
): Promise<ActionResponse> {
  const uploadedProductImages: string[] = [];
  try {
    let productId = formData.uniqueId;
    const variantIds: string[] = [];
    const createdVariantOptionIds: { [variantIndex: number]: string[] } = {};

    // 1. Variant'ları oluştur/güncelle
    for (let i = 0; i < formData.selectedVariants.length; i++) {
      const variantData = formData.selectedVariants[i];

      const variantResult = await CreateOrUpdateVariantAndOptions(
        variantData,
        i === 0 ? productId || undefined : undefined
      );

      if (!variantResult.success || !variantResult.variantId) {
        console.error("❌ Variant oluşturma başarısız:", variantResult.message);
        return variantResult;
      }

      variantIds.push(variantResult.variantId);

      const variantOptions = await prisma.variantOption.findMany({
        where: { variantId: variantResult.variantId },
        orderBy: { createdAt: "asc" },
        include: { translations: true },
      });

      createdVariantOptionIds[i] = variantOptions.map((opt) => opt.id);
    }

    // 2. 🎯 Product resimlerini işle
    const productImageAssets: Asset[] = [];
    if (formData.images && formData.images.length > 0) {
      for (const image of formData.images) {
        const uploadedImage = await uploadFileToMinio({
          bucketName: "product-images",
          file: image,
          isNeedOg: true,
          isNeedThumbnail: true,
        });

        if (uploadedImage.success && uploadedImage.data) {
          uploadedProductImages.push(uploadedImage.data.originalUrl);
          const asset = await prisma.asset.create({
            data: {
              url: uploadedImage.data.originalUrl,
              type: "IMAGE",
            },
          });
          productImageAssets.push(asset);
        }
      }
    }

    // 3. 🔧 Product oluştur/güncelle
    const product = await prisma.product.upsert({
      where: { id: productId || "non-existent-id" },
      create: {
        type: formData.productType,
        translations: {
          createMany: {
            data: formData.translations.map((translation) => ({
              name: translation.name,
              slug: slugify(translation.name),
              locale: translation.locale,
              description: translation.description,
              metaDescription: translation.metaDescription,
              metaTitle: translation.metaTitle,
              shortDescription: translation.shortDescription,
            })),
          },
        },
        assets: {
          createMany: {
            data: productImageAssets.map((image, index) => ({
              assetId: image.id,
              order: index,
            })),
          },
        },
        brandId: formData.brandId || null,
        categories: {
          create:
            formData.categoryIds?.map((categoryId) => ({
              categoryId,
            })) || [],
        },
      },
      update: {
        type: formData.productType,
        brandId: formData.brandId || null,
        translations: {
          upsert: formData.translations.map((translation) => ({
            where: {
              locale_productId: {
                locale: translation.locale,
                productId: productId || "non-existent-id",
              },
            },
            create: {
              name: translation.name,
              slug: slugify(translation.name),
              locale: translation.locale,
              description: translation.description,
              metaDescription: translation.metaDescription,
              metaTitle: translation.metaTitle,
              shortDescription: translation.shortDescription,
            },
            update: {
              name: translation.name,
              slug: slugify(translation.name),
              description: translation.description,
              metaDescription: translation.metaDescription,
              metaTitle: translation.metaTitle,
              shortDescription: translation.shortDescription,
            },
          })),
        },
        // ⭐ YENİ: Kategorileri güncelle
        ...(formData.categoryIds && {
          categories: {
            deleteMany: {},
            create: formData.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },
        }),
      },
    });

    productId = product.id;

    // 4. 🚀 YENİ ASSET'LARI MEVCUT ASSET'LARIN ÜZERİNE EKLE
    if (productImageAssets.length > 0) {
      // Mevcut asset'ların en büyük order değerini bul
      const maxOrder = await prisma.productAsset.findFirst({
        where: { productId },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      const startOrder = (maxOrder?.order ?? -1) + 1;

      // Yeni asset'ları mevcut asset'ların üzerine ekle
      await prisma.productAsset.createMany({
        data: productImageAssets.map((image, index) => ({
          productId,
          assetId: image.id,
          order: startOrder + index,
        })),
      });
    }

    // 5. Variant gruplarını oluştur
    const variantGroupResult = await CreateProductVariantGroups(
      productId,
      variantIds
    );
    if (!variantGroupResult.success) {
      return variantGroupResult;
    }

    // 6. Available options'ları ayarla
    const variantGroupsWithOptions = formData.selectedVariants.map(
      (variant, index) => ({
        variantId: variantIds[index],
        optionIds: createdVariantOptionIds[index] || [],
      })
    );

    const availableOptionsResult = await SetProductVariantAvailableOptions(
      productId,
      variantGroupsWithOptions
    );
    if (!availableOptionsResult.success) {
      return availableOptionsResult;
    }

    // 7. Kombinasyonları oluştur
    if (formData.variants && formData.variants.length > 0) {
      const combinationData = formData.variants.map((variant, variantIndex) => {
        const mappedOptions: {
          variantOptionId: string;
          variantGroupId: string;
        }[] = [];

        const productVariantGroups = variantIds.map((variantId, idx) => ({
          variantId,
          index: idx,
        }));

        for (let i = 0; i < variant.options.length; i++) {
          const formOption = variant.options[i];
          const variantGroupOptions = createdVariantOptionIds[i] || [];

          const selectedVariant = formData.selectedVariants[i];
          const optionIndexInVariant = selectedVariant.options.findIndex(
            (opt) => opt.uniqueId === formOption.variantOptionId
          );

          if (
            optionIndexInVariant !== -1 &&
            variantGroupOptions[optionIndexInVariant]
          ) {
            mappedOptions.push({
              variantOptionId: variantGroupOptions[optionIndexInVariant],
              variantGroupId: productVariantGroups[i]?.variantId || "",
            });
          }
        }

        return {
          options: mappedOptions,
          sku: variant.sku || `SKU-${Date.now().toString(36)}`,
          stock: variant.stock,
          barcode: variant.barcode || "",
          images: variant.images || [],
          prices: variant.prices.map((price) => ({
            currency: price.currency,
            price: price.price,
            discountedPrice: price.discountedPrice || null,
            buyedPrice: price.buyedPrice || null,
          })),
          translations: variant.translations.map((translation) => ({
            locale: translation.locale,
            name: `${formData.translations[0]?.name || "Ürün"} - ${
              variant.sku
            }`,
            slug: slugify(
              `${formData.translations[0]?.name || "Ürün"} - ${variant.sku}`
            ),
            description: translation.description || null,
            shortDescription: translation.shortDescription || null,
            metaTitle: translation.metaTitle || null,
            metaDescription: translation.metaDescription || null,
          })),
        };
      });

      const combinationResult = await CreateProductVariantCombinations(
        productId,
        combinationData
      );

      if (!combinationResult.success) {
        console.error(
          "❌ Kombinasyon oluşturma başarısız:",
          combinationResult.message
        );
        return combinationResult;
      }
    }

    return {
      success: true,
      message:
        productId === formData.uniqueId
          ? "Variant ürün başarıyla güncellendi"
          : "Variant ürün başarıyla oluşturuldu",
    };
  } catch (error) {
    for (const imageUrl of uploadedProductImages) {
      await DeleteImage({ url: imageUrl });
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? `Ürün işlemi başarısız: ${error.message}`
          : "Beklenmeyen bir hata oluştu",
    };
  }
}

export async function DeleteVariantOption(
  variantOptionId: string
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(
      async (tx) => {
        // Kullanım kontrolü
        const usageInCombinations =
          await tx.productVariantCombinationOption.count({
            where: { variantOptionId },
          });

        const usageInGroups = await tx.productVariantGroupOption.count({
          where: { variantOptionId },
        });

        if (usageInCombinations > 0 || usageInGroups > 0) {
          throw new Error(
            "Bu variant seçeneği aktif olarak kullanılıyor, silinemez"
          );
        }

        // Resmi sil
        const variantOption = await tx.variantOption.findUnique({
          where: { id: variantOptionId },
          include: { image: true },
        });

        if (variantOption?.image) {
          await DeleteImage({ url: variantOption.image.url });
          await tx.asset.delete({
            where: { id: variantOption.image.id },
          });
        }

        // Variant option'ı sil
        await tx.variantOption.delete({
          where: { id: variantOptionId },
        });
      },
      { timeout: 60000 }
    );

    return {
      success: true,
      message: "Variant seçeneği başarıyla silindi",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Variant seçeneği silinirken hata oluştu",
    };
  }
}

export async function DeleteVariant(
  variantId: string
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(
      async (tx) => {
        // Kullanım kontrolü
        const usageInProducts = await tx.productVariantGroup.count({
          where: { variantId },
        });

        if (usageInProducts > 0) {
          throw new Error("Bu variant aktif ürünlerde kullanılıyor, silinemez");
        }

        // Variant options'ları ve resimlerini sil
        const variantOptions = await tx.variantOption.findMany({
          where: { variantId },
          include: { image: true },
        });

        for (const option of variantOptions) {
          if (option.image) {
            await DeleteImage({ url: option.image.url });
            await tx.asset.delete({
              where: { id: option.image.id },
            });
          }
        }

        // Variant'ı sil (cascade ile options da silinir)
        await tx.variant.delete({
          where: { id: variantId },
        });
      },
      { timeout: 60000 }
    ); // 60 saniye timeout

    return {
      success: true,
      message: "Variant başarıyla silindi",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Variant silinirken hata oluştu",
    };
  }
}

export async function DeleteImageFromProduct(
  assetUrl: string,
  productId: string
): Promise<ActionResponse> {
  try {
    // 1. İlk önce veritabanı işlemlerini yap
    await prisma.$transaction(async (tx) => {
      // Asset'i bul
      const asset = await tx.asset.findUnique({
        where: { url: assetUrl },
      });

      if (!asset) {
        throw new Error("Asset bulunamadı");
      }

      // ProductAsset ilişkisini bul ve sil
      const productAsset = await tx.productAsset.findFirst({
        where: {
          productId,
          assetId: asset.id,
        },
      });

      if (!productAsset) {
        throw new Error("Bu resim bu ürüne ait değil");
      }

      // ProductAsset'i sil
      await tx.productAsset.delete({
        where: { id: productAsset.id },
      });

      // Reorder: Kalan asset'ları yeniden sırala
      const remainingAssets = await tx.productAsset.findMany({
        where: { productId },
        orderBy: { order: "asc" },
      });

      // Order'ları yeniden düzenle (0, 1, 2, 3...)
      for (let i = 0; i < remainingAssets.length; i++) {
        if (remainingAssets[i].order !== i) {
          await tx.productAsset.update({
            where: { id: remainingAssets[i].id },
            data: { order: i },
          });
        }
      }
    });

    const cloudDeleteResult = await DeleteObject({ url: assetUrl });
    if (!cloudDeleteResult.success) {
      console.warn("⚠️ DB'den silindi ama cloud'dan silinemedi:", assetUrl);
      return {
        success: true,
        message:
          "Resim üründen kaldırıldı ve sıralama güncellendi. (Cloud silme uyarısı: " +
          cloudDeleteResult.message +
          ")",
      };
    }

    return {
      success: true,
      message:
        "Resim üründen başarıyla kaldırıldı, sıralama güncellendi ve cloud'dan silindi.",
    };
  } catch (error) {
    console.error("❌ Error removing image from product:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Ürün resmi silme işlemi başarısız.",
    };
  }
}
export async function DeleteImageFromVariantCombination(
  assetUrl: string
): Promise<ActionResponse> {
  try {
    await prisma.$transaction(async (tx) => {
      // Asset'i ve tüm variant image ilişkilerini getir
      const asset = await tx.asset.findUnique({
        where: { url: assetUrl },
        include: {
          variantImages: {
            select: {
              id: true,
              combinationId: true,
              order: true,
            },
          },
        },
      });

      if (!asset) {
        throw new Error("Asset bulunamadı");
      }

      if (asset.variantImages.length === 0) {
        throw new Error("Bu asset hiçbir variant kombinasyonuna ait değil");
      }

      // Eğer birden fazla variant image ilişkisi varsa hata ver
      if (asset.variantImages.length > 1) {
        throw new Error(
          "Bu asset birden fazla variant kombinasyonuna ait, hangisini silmek istediğinizi belirtin"
        );
      }

      const variantImage = asset.variantImages[0];

      // ProductVariantImage'ı sil
      await tx.productVariantImage.delete({
        where: { id: variantImage.id },
      });

      // Reorder: Kalan image'ları yeniden sırala
      const remainingImages = await tx.productVariantImage.findMany({
        where: { combinationId: variantImage.combinationId },
        orderBy: { order: "asc" },
      });

      // Order'ları yeniden düzenle (0, 1, 2, 3...)
      for (let i = 0; i < remainingImages.length; i++) {
        if (remainingImages[i].order !== i) {
          await tx.productVariantImage.update({
            where: { id: remainingImages[i].id },
            data: { order: i },
          });
        }
      }
    });

    // Cloud'dan sil
    const cloudDeleteResult = await DeleteObject({ url: assetUrl });
    if (!cloudDeleteResult.success) {
      return {
        success: true,
        message:
          "Resim variant kombinasyonundan kaldırıldı ve sıralama güncellendi. (Cloud silme uyarısı: " +
          cloudDeleteResult.message +
          ")",
      };
    }

    return {
      success: true,
      message:
        "Resim variant kombinasyonundan başarıyla kaldırıldı, sıralama güncellendi ve cloud'dan silindi.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Variant resmi silme işlemi başarısız.",
    };
  }
}
