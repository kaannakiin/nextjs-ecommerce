import {
  AssetType,
  Currency,
  Locale,
  VariantType,
} from "@/app/generated/prisma";
import * as z from "zod";

export const PRODUCT_ASSET_MAX_FILES = 10; // Maksimum dosya sayısı
export const PRODUCT_ASSET_MEDIA_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
export const PRODUCT_ASSET_MEDIA_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
];

const htmlTagRegex = /^(<[^>]+>.*<\/[^>]+>|<[^>]+\/>|[^<>]*)*$/;
const scriptTagRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const unsafeTagRegex =
  /<(script|iframe|object|embed|link|meta|base|form|input|button|select|textarea|style)\b[^>]*>/gi;

const validateHTML = (html: string): boolean => {
  if (!htmlTagRegex.test(html)) {
    return false;
  }

  if (scriptTagRegex.test(html) || unsafeTagRegex.test(html)) {
    return false;
  }

  return true;
};

export const ProductImageSchema = z
  .instanceof(File)
  .refine(
    (file) => {
      if (file.size > PRODUCT_ASSET_MEDIA_MAX_SIZE) {
        return false;
      }
      return true;
    },
    {
      error: `Ürün resmi ${
        PRODUCT_ASSET_MEDIA_MAX_SIZE / 1024 / 1024
      } MB'den küçük olmalıdır`,
    }
  )
  .refine(
    (file) => {
      return PRODUCT_ASSET_MEDIA_MIME_TYPES.includes(file.type);
    },
    {
      error: `Ürün resmi sadece ${PRODUCT_ASSET_MEDIA_MIME_TYPES.join(", ")
        .split("/")
        .pop()} formatlarını destekler`,
    }
  );

export const ProductPriceSchema = z
  .object({
    locale: z.enum(Locale),
    currency: z.enum(Currency),
    price: z
      .number({
        error: "Fiyat tutarını giriniz",
      })
      .nonnegative({ error: "Fiyat tutar 0'dan küçük olamaz" }),
    discountedPrice: z
      .number({
        error: "İndirimli fiyat tutarını giriniz",
      })
      .nonnegative({
        error: "İndirimli fiyat tutar 0'dan küçük olamaz",
      })
      .optional()
      .nullable(),
  })
  .check(({ value, issues }) => {
    if (value.discountedPrice && value.price < value.discountedPrice) {
      issues.push({
        code: "custom",
        message: "İndirimli fiyat, normal fiyatı geçemez",
        input: "discountedPrice",
        path: ["discountedPrice"],
      });
    }
  });

export const ProductTranslationSchema = z.object({
  locale: z.enum(Locale, {
    error: "Lütfen geçerli bir dil seçiniz",
  }),
  name: z
    .string({
      error: "Ürün adını giriniz",
    })
    .nonempty({
      error: "Ürün adı boş olamaz",
    })
    .max(512, {
      error: "Ürün adı 512 karakterden uzun olamaz",
    }),
  slug: z
    .string({
      error: "Ürün slug'ını giriniz",
    })
    .nonempty({
      error: "Ürün slug'ı boş olamaz",
    })
    .max(512, {
      error: "Ürün slug'ı 512 karakterden uzun olamaz",
    }),
  description: z
    .string({
      error: "Ürün açıklamasını giriniz",
    })
    .refine(
      (value) => {
        if (!value) return true; // nullable/optional için
        return validateHTML(value);
      },
      {
        message:
          "Ürün açıklaması geçerli HTML formatında olmalıdır ve güvenli olmayan etiketler içermemelidir",
      }
    )
    .max(10000, {
      error: "Ürün açıklaması 10,000 karakterden uzun olamaz",
    })
    .optional()
    .nullable(),
  shortDescription: z
    .string({
      error: "Ürün kısa açıklamasını giriniz",
    })
    .optional()
    .nullable(),
  metaTitle: z
    .string({
      error: "Ürün meta başlığını giriniz",
    })
    .max(256, {
      error: "Ürün meta başlığı 256 karakterden uzun olamaz",
    })
    .optional()
    .nullable(),
  metaDescription: z
    .string({
      error: "Ürün meta açıklamasını giriniz",
    })
    .max(512, {
      error: "Ürün meta açıklaması 512 karakterden uzun olamaz",
    })
    .optional()
    .nullable(),
});

export type ProductPrice = z.infer<typeof ProductPriceSchema>;
export type ProductTranslation = z.infer<typeof ProductTranslationSchema>;

export const BasicProductSchema = z.object({
  googleTaxonomyId: z.string().optional().nullable(),
  categoryId: z
    .cuid2({ error: "Lütfen geçerli bir kategori seçiniz" })
    .optional()
    .nullable(),
  prices: z
    .array(ProductPriceSchema, {
      error: "Ürün fiyatlarını giriniz",
    })
    .refine((prices) => prices.some((price) => price.locale === "TR"), {
      error: "En az bir fiyat Türkçe dilinde olmalıdır",
    })
    .refine(
      (prices) => {
        // Her locale'nin sadece bir kez kullanıldığını kontrol et
        const locales = new Set();

        for (const price of prices) {
          if (locales.has(price.locale)) {
            return false; // Aynı locale birden fazla kez bulundu
          }
          locales.add(price.locale);
        }

        return true;
      },
      {
        message: "Her dil için sadece bir fiyat tanımlanabilir",
      }
    ),
  translations: z
    .array(ProductTranslationSchema, { error: "Ürün çevirilerini giriniz" })
    .refine(
      (translations) =>
        translations.some((translation) => translation.locale === "TR"),
      { error: "En az bir çeviri Türkçe dilinde olmalıdır" }
    )
    .refine(
      (translations) => {
        // Her locale'nin sadece bir kez kullanıldığını kontrol et
        const locales = new Set();

        for (const translation of translations) {
          if (locales.has(translation.locale)) {
            return false; // Aynı locale birden fazla kez bulundu
          }
          locales.add(translation.locale);
        }

        return true;
      },
      {
        message: "Her dil için sadece bir çeviri tanımlanabilir",
      }
    ),
  images: z.array(ProductImageSchema, {
    error: "Ürün resimlerini giriniz",
  }),
});

export type BasicProduct = z.infer<typeof BasicProductSchema>;

export const CategorySchema = z.object({
  uniqueId: z.cuid2().optional().nullable(),
  translations: z
    .array(
      z.object({
        locale: z.enum(Locale, {
          error: "Lütfen geçerli bir dil seçiniz",
        }),
        name: z
          .string({
            error: "Kategori adını giriniz",
          })
          .nonempty({
            error: "Kategori adı boş olamaz",
          })
          .max(512, {
            error: "Kategori adı 512 karakterden uzun olamaz",
          }),
        slug: z
          .string({
            error: "Kategori slug'ını giriniz",
          })
          .nonempty({
            error: "Kategori slug'ı boş olamaz",
          })
          .max(512, {
            error: "Kategori slug'ı 512 karakterden uzun olamaz",
          }),
        description: z
          .string({
            error: "Kategori açıklamasını giriniz",
          })
          .refine(
            (value) => {
              if (!value) return true; // nullable/optional için
              return validateHTML(value);
            },
            {
              message:
                "Kategori açıklaması geçerli HTML formatında olmalıdır ve güvenli olmayan etiketler içermemelidir",
            }
          )
          .max(10000, {
            error: "Kategori açıklaması 10,000 karakterden uzun olamaz",
          })
          .optional()
          .nullable(),
        metaTitle: z
          .string({
            error: "Kategori meta başlığını giriniz",
          })
          .max(256, {
            error: "Kategori meta başlığı 256 karakterden uzun olamaz",
          })
          .optional()
          .nullable(),
        metaDescription: z
          .string({
            error: "Kategori meta açıklamasını giriniz",
          })
          .max(512, {
            error: "Kategori meta açıklaması 512 karakterden uzun olamaz",
          })
          .optional()
          .nullable(),
      })
    )
    .refine(
      (translations) => {
        return translations.some((translation) => translation.locale === "TR");
      },
      {
        error: "En az bir çeviri Türkçe dilinde olmalıdır",
      }
    )
    .refine(
      (translations) => {
        // Her locale'nin sadece bir kez kullanıldığını kontrol et
        const locales = new Set();

        for (const translation of translations) {
          if (locales.has(translation.locale)) {
            return false; // Aynı locale birden fazla kez bulundu
          }
          locales.add(translation.locale);
        }

        return true;
      },
      {
        message: "Her dil için sadece bir çeviri tanımlanabilir",
      }
    ),
  parentCategoryId: z
    .cuid2({
      error: "Lütfen geçerli bir üst kategori seçiniz",
    })
    .optional()
    .nullable(),
  image: z
    .instanceof(File)
    .refine(
      (file) => {
        if (file.size > PRODUCT_ASSET_MEDIA_MAX_SIZE) {
          return false;
        }
        return true;
      },
      {
        error: `Kategori resmi ${
          PRODUCT_ASSET_MEDIA_MAX_SIZE / 1024 / 1024
        } MB'den küçük olmalıdır`,
      }
    )
    .refine(
      (file) => {
        return PRODUCT_ASSET_MEDIA_MIME_TYPES.includes(file.type);
      },
      {
        error: `Kategori resmi sadece ${PRODUCT_ASSET_MEDIA_MIME_TYPES.join(
          ", "
        )
          .split("/")
          .pop()} formatlarını destekler`,
      }
    )
    .optional()
    .nullable(),
  existingImages: z
    .url({ error: "Lütfen geçerli bir resim URL'si giriniz" })
    .startsWith("https://")
    .optional()
    .nullable(),
});

export type Category = z.infer<typeof CategorySchema>;

export const BrandTranslationSchema = z.object({
  locale: z.enum(Locale, {
    error: "Lütfen geçerli bir dil seçiniz",
  }),
  name: z
    .string({
      error: "Marka adını giriniz",
    })
    .nonempty({
      error: "Marka adı boş olamaz",
    })
    .max(512, {
      error: "Marka adı 512 karakterden uzun olamaz",
    }),
  slug: z
    .string({
      error: "Marka slug'ını giriniz",
    })
    .nonempty({
      error: "Marka slug'ı boş olamaz",
    })
    .max(512, {
      error: "Marka slug'ı 512 karakterden uzun olamaz",
    }),
  description: z
    .string({
      error: "Marka açıklamasını giriniz",
    })
    .refine((value) => {
      if (!value) return true; // nullable/optional için
      return validateHTML(value);
    })
    .max(10000, {
      error: "Marka açıklaması 10,000 karakterden uzun olamaz",
    })
    .optional()
    .nullable(),
  metaTitle: z
    .string({
      error: "Marka meta başlığını giriniz",
    })
    .max(256, {
      error: "Marka meta başlığı 256 karakterden uzun olamaz",
    })
    .optional()
    .nullable(),
  metaDescription: z
    .string({
      error: "Marka meta açıklamasını giriniz",
    })
    .max(512, {
      error: "Marka meta açıklaması 512 karakterden uzun olamaz",
    })
    .optional()
    .nullable(),
});
export const BrandSchema = z.object({
  uniqueId: z.cuid2().optional().nullable(),
  translations: z
    .array(BrandTranslationSchema, {
      error: "Marka çevirilerini giriniz",
    })
    .refine(
      (translations) =>
        translations.some((translation) => translation.locale === "TR"),
      { error: "En az bir çeviri Türkçe dilinde olmalıdır" }
    )
    .refine(
      (translations) => {
        // Her locale'nin sadece bir kez kullanıldığını kontrol et
        const locales = new Set();

        for (const translation of translations) {
          if (locales.has(translation.locale)) {
            return false; // Aynı locale birden fazla kez bulundu
          }
          locales.add(translation.locale);
        }

        return true;
      },
      { error: "Her dil için sadece bir çeviri tanımlanabilir" }
    ),
  image: z
    .instanceof(File)
    .refine(
      (file) => {
        if (file.size > PRODUCT_ASSET_MEDIA_MAX_SIZE) {
          return false;
        }
        return true;
      },
      {
        error: `Marka resmi ${
          PRODUCT_ASSET_MEDIA_MAX_SIZE / 1024 / 1024
        } MB'den küçük olmalıdır`,
      }
    )
    .refine(
      (file) => {
        return PRODUCT_ASSET_MEDIA_MIME_TYPES.includes(file.type);
      },
      {
        error: `Marka resmi sadece ${PRODUCT_ASSET_MEDIA_MIME_TYPES.join(", ")
          .split("/")
          .pop()} formatlarını destekler`,
      }
    )
    .optional()
    .nullable(),
  parentBrandId: z
    .cuid2({
      error: "Lütfen geçerli bir üst marka seçiniz",
    })
    .optional()
    .nullable(),
  existingImages: z
    .object({
      url: z
        .url({ error: "Lütfen geçerli bir resim URL'si giriniz" })
        .startsWith("https://"),
      type: z.enum(AssetType, {
        error: "Lütfen geçerli bir resim tipi giriniz",
      }),
    })
    .optional()
    .nullable(),
});

export type Brand = z.infer<typeof BrandSchema>;
export type BrandTranslation = z.infer<typeof BrandTranslationSchema>;

export const VariantOptionTranslationSchema = z.object({
  locale: z.enum(Locale, {
    error: "Lütfen geçerli bir dil seçiniz",
  }),
  name: z
    .string({
      error: "Varyant seçeneği adını giriniz",
    })
    .nonempty({
      error: "Varyant seçeneği adı boş olamaz",
    })
    .max(512, {
      error: "Varyant seçeneği adı 512 karakterden uzun olamaz",
    }),
});
export const VariantOptionSchema = z.object({
  uniqueId: z.cuid2().optional().nullable(),
  value: z
    .string({ error: "Varyant seçeneği değerini giriniz" })
    .nonempty({
      error: "Varyant seçeneği değeri boş olamaz",
    })
    .max(512, {
      error: "Varyant seçeneği değeri 512 karakterden uzun olamaz",
    }),
  translations: z
    .array(VariantOptionTranslationSchema, {
      error: "Varyant seçeneği çevirilerini giriniz",
    })
    .refine(
      (translations) =>
        translations.some((translation) => translation.locale === "TR"),
      {
        error: "En az bir çeviri Türkçe dilinde olmalıdır",
      }
    )
    .refine(
      (translations) => {
        const locales = new Set();
        for (const translation of translations) {
          if (locales.has(translation.locale)) {
            return false;
          }
          locales.add(translation.locale);
        }
        return true;
      },
      {
        message: "Her dil için sadece bir çeviri tanımlanabilir",
      }
    ),
  image: z
    .instanceof(File)
    .refine(
      (file) => {
        if (file.size > PRODUCT_ASSET_MEDIA_MAX_SIZE) {
          return false;
        }
        return true;
      },
      {
        error: `Marka resmi ${
          PRODUCT_ASSET_MEDIA_MAX_SIZE / 1024 / 1024
        } MB'den küçük olmalıdır`,
      }
    )
    .refine(
      (file) => {
        return PRODUCT_ASSET_MEDIA_MIME_TYPES.includes(file.type);
      },
      {
        error: `Marka resmi sadece ${PRODUCT_ASSET_MEDIA_MIME_TYPES.join(", ")
          .split("/")
          .pop()} formatlarını destekler`,
      }
    )
    .optional()
    .nullable(),
  existingImages: z
    .object({
      url: z
        .url({ error: "Lütfen geçerli bir resim URL'si giriniz" })
        .startsWith("https://"),
      type: z.enum(AssetType, {
        error: "Lütfen geçerli bir resim tipi giriniz",
      }),
    })
    .optional()
    .nullable(),
});
export type VariantOption = z.infer<typeof VariantOptionSchema>;
export type VariantOptionTranslation = z.infer<
  typeof VariantOptionTranslationSchema
>;

export const VariantTranslationSchema = z.object({
  locale: z.enum(Locale, {
    error: "Lütfen geçerli bir dil seçiniz",
  }),
  name: z
    .string({
      error: "Varyant adını giriniz",
    })
    .nonempty({
      error: "Varyant adı boş olamaz",
    })
    .max(512, {
      error: "Varyant adı 512 karakterden uzun olamaz",
    }),
});
export const VariantSchema = z.object({
  uniqueId: z.cuid2().optional().nullable(),
  translations: z
    .array(VariantTranslationSchema, {
      error: "Varyant çevirilerini giriniz",
    })
    .refine(
      (translations) =>
        translations.some((translation) => translation.locale === "TR"),
      { error: "En az bir çeviri Türkçe dilinde olmalıdır" }
    )
    .refine(
      (translations) => {
        const locales = new Set();
        for (const translation of translations) {
          if (locales.has(translation.locale)) {
            return false;
          }
          locales.add(translation.locale);
        }
        return true;
      },
      { error: "Her dil için sadece bir çeviri tanımlanabilir" }
    ),
  type: z.enum(VariantType, {
    error: "Lütfen geçerli bir varyant tipi seçiniz",
  }),
  options: z
    .array(VariantOptionSchema, {
      error: "Varyant seçeneklerini giriniz",
    })
    .refine((options) => options.length > 0, {
      error: "En az bir varyant seçeneği tanımlanmalıdır",
    }),
});

export type Variant = z.infer<typeof VariantSchema>;
export type VariantTranslation = z.infer<typeof VariantTranslationSchema>;
