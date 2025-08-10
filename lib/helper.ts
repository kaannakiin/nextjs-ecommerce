import { AssetType, ProductType } from "@/app/generated/prisma";
import {
  Variant,
  VariantProduct,
  VariantOption,
  ProductPrice,
} from "@/schemas/product-schema";
import { createId } from "@paralleldrive/cuid2";

export function getAssetTypeLabel(type: AssetType): string {
  switch (type) {
    case "IMAGE":
      return "Resim";
    case "VIDEO":
      return "Video";
    case "DOCUMENT":
      return "Belge";
    default:
      return "Resim";
  }
}

export function getProductTypeLabel(type: ProductType): string {
  switch (type) {
    case "PHYSICAL":
      return "Fiziksel Ürün";
    case "DIGITAL":
      return "Dijital Ürün";
    default:
      return "Fiziksel Ürün";
  }
}

/**
 * Varyant kombinasyon isimlerini getirir
 */
export function getVariantCombinationNames(
  variantIds: VariantProduct["variants"][number]["options"],
  variants: VariantProduct["selectedVariants"]
): string[] {
  return variantIds.map((variantId): string => {
    // Varyant grubunu bul
    const variantGroup = variants.find(
      (v) => v.uniqueId === variantId.variantGroupId
    );
    if (!variantGroup) return "Bilinmiyor";
    const option = variantGroup.options.find(
      (opt) => opt.uniqueId === variantId.variantOptionId
    );
    if (!option) return "Bilinmiyor";

    // Türkçe ismi döndür
    return (
      option.translations.find((t) => t.locale === "TR")?.name ||
      option.translations[0]?.name ||
      "Bilinmiyor"
    );
  });
}

// Type definitions derived from Zod schemas
type VariantCombinationOption =
  VariantProduct["variants"][number]["options"][number];
type VariantWithCombinations = VariantProduct["variants"][number];
type SelectedVariant = VariantProduct["selectedVariants"][number];

// Helper types for internal use
interface VariantOptionWithInfo {
  variantGroupId: string;
  variantOptionId: string;
  optionName: string;
}

/**
 * Kartezyen çarpım hesaplar
 */
function cartesianProduct(
  arrays: VariantOptionWithInfo[][]
): VariantOptionWithInfo[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map((item) => [item]);

  const result: VariantOptionWithInfo[][] = [];
  const firstArray = arrays[0];
  const restProduct = cartesianProduct(arrays.slice(1));

  for (const item of firstArray) {
    for (const restCombination of restProduct) {
      result.push([item, ...restCombination]);
    }
  }

  return result;
}

/**
 * Kombinasyon signature'ı oluşturur
 */
function createCombinationSignature(
  combination: VariantOptionWithInfo[]
): string {
  return combination
    .map((opt) => `${opt.variantGroupId}-${opt.variantOptionId}`)
    .sort()
    .join("|");
}

/**
 * Mevcut kombinasyon signature'ı oluşturur
 */
function createExistingCombinationSignature(
  options: VariantProduct["variants"][number]["options"]
): string {
  return options
    .map((opt) => `${opt.variantGroupId}-${opt.variantOptionId}`)
    .sort()
    .join("|");
}

/**
 * SKU oluşturur - option isimlerinin ilk 3 harfini alır
 */
export function generateSKU(optionNames: string[]): string {
  if (optionNames.length === 0) return createId().slice(0, 8).toUpperCase();

  const skuParts = optionNames.map((name: string): string => {
    // Türkçe karakterleri değiştir ve sadece harf/rakam al
    const cleaned = name
      .replace(/ğ/g, "g")
      .replace(/Ğ/g, "G")
      .replace(/ü/g, "u")
      .replace(/Ü/g, "U")
      .replace(/ş/g, "s")
      .replace(/Ş/g, "S")
      .replace(/ı/g, "i")
      .replace(/İ/g, "I")
      .replace(/ö/g, "o")
      .replace(/Ö/g, "O")
      .replace(/ç/g, "c")
      .replace(/Ç/g, "C")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    return cleaned.slice(0, 3);
  });

  const baseSKU = skuParts.join("-");

  // Eğer çok kısa ise random id ekle
  if (baseSKU.length < 6) {
    return baseSKU + "-" + createId().slice(0, 4).toUpperCase();
  }

  return baseSKU;
}

/**
 * Barcode oluşturur - SKU'nun başına BR ekler
 */
export function generateBarcode(sku: string): string {
  return "BR" + sku;
}

/**
 * Yeni varyant kombinasyonu oluşturur
 */
function createNewVariantCombination(
  combination: VariantOptionWithInfo[]
): VariantWithCombinations {
  const optionNames = combination.map((opt) => opt.optionName);
  const generatedSKU = generateSKU(optionNames);
  const generatedBarcode = generateBarcode(generatedSKU);

  // Default price structure from Zod schema
  const defaultPrice: ProductPrice = {
    locale: "TR" as const,
    currency: "TRY" as const,
    price: 0,
    discountedPrice: null,
    buyedPrice: null,
  };

  const newCombination: VariantWithCombinations = {
    options: combination.map(
      (opt): VariantCombinationOption => ({
        variantGroupId: opt.variantGroupId,
        variantOptionId: opt.variantOptionId,
      })
    ),
    prices: [defaultPrice],
    sku: generatedSKU,
    barcode: generatedBarcode,
    stock: 0,
    images: [],
    translations: [
      {
        locale: "TR" as const,
        description: null,
        shortDescription: null,
        metaTitle: null,
        metaDescription: null,
      },
    ],
  };

  return newCombination;
}

/**
 * Varyant kombinasyonlarını oluşturur
 */
export function generateCombination(
  selectedVariantsWithoutFormData: VariantProduct["selectedVariants"],
  existingCombinations: VariantProduct["variants"],
  formData: Variant
): VariantProduct["variants"] {
  // Yeni varyant listesi (formData dahil)
  const allVariants: Variant[] = [...selectedVariantsWithoutFormData, formData];

  // Her varyant grubu için seçenekleri hazırla
  const variantOptions: VariantOptionWithInfo[][] = allVariants.map(
    (variant): VariantOptionWithInfo[] => {
      return variant.options.map(
        (option): VariantOptionWithInfo => ({
          variantGroupId: variant.uniqueId!,
          variantOptionId: option.uniqueId!,
          optionName:
            option.translations.find((t) => t.locale === "TR")?.name ||
            option.translations[0]?.name ||
            "Bilinmiyor",
        })
      );
    }
  );

  // Tüm kombinasyonları oluştur
  const allCombinations = cartesianProduct(variantOptions);

  // Yeni kombinasyonları oluştur
  const newCombinations: VariantProduct["variants"] = allCombinations.map(
    (combination): VariantWithCombinations => {
      // Bu kombinasyonun signature'ını oluştur
      const combinationSignature = createCombinationSignature(combination);

      // Mevcut kombinasyonlarda aynısı var mı kontrol et
      const existingCombination = existingCombinations.find(
        (existing): boolean => {
          const existingSignature = createExistingCombinationSignature(
            existing.options
          );
          return existingSignature === combinationSignature;
        }
      );

      if (existingCombination) {
        // Mevcut kombinasyonu koru
        return existingCombination;
      }

      // Yeni kombinasyon oluştur
      return createNewVariantCombination(combination);
    }
  );

  return newCombinations;
}

/**
 * Update action types
 */
type UpdateAction = {
  type: "ADD" | "REMOVE" | "UPDATE" | "REORDER";
  variant?: Variant;
  variantId?: string;
  variants?: VariantProduct["selectedVariants"];
};

/**
 * Varyant güncellemesi için kombinasyonları günceller
 */
export function updateVariantCombinations(
  existingCombinations: VariantProduct["variants"],
  selectedVariants: VariantProduct["selectedVariants"],
  action: UpdateAction
): VariantProduct["variants"] {
  switch (action.type) {
    case "REMOVE": {
      if (!action.variantId) return existingCombinations;

      // Silinen varyant grubunu içeren kombinasyonları filtrele
      const filteredCombinations = existingCombinations.filter(
        (combination): boolean => {
          return !combination.options.some(
            (opt) => opt.variantGroupId === action.variantId
          );
        }
      );

      return filteredCombinations;
    }

    case "UPDATE": {
      if (!action.variant) return existingCombinations;

      // ÖNEMLI: selectedVariants sırasını koruyarak güncelle
      const updatedVariants = selectedVariants.map((variant) =>
        variant.uniqueId === action.variant!.uniqueId
          ? action.variant!
          : variant
      );

      // Sıralı varyant seçeneklerini hazırla (selectedVariants sırasıyla)
      const variantOptions: VariantOptionWithInfo[][] = updatedVariants.map(
        (variant): VariantOptionWithInfo[] => {
          return variant.options.map(
            (option): VariantOptionWithInfo => ({
              variantGroupId: variant.uniqueId!,
              variantOptionId: option.uniqueId!,
              optionName:
                option.translations.find((t) => t.locale === "TR")?.name ||
                option.translations[0]?.name ||
                "Bilinmiyor",
            })
          );
        }
      );

      const allCombinations = cartesianProduct(variantOptions);

      const newCombinations: VariantProduct["variants"] = allCombinations.map(
        (combination): VariantWithCombinations => {
          // Bu kombinasyonun signature'ını oluştur
          const combinationSignature = createCombinationSignature(combination);

          // Mevcut kombinasyonlarda aynısı var mı kontrol et
          const existingCombination = existingCombinations.find(
            (existing): boolean => {
              const existingSignature = createExistingCombinationSignature(
                existing.options
              );
              return existingSignature === combinationSignature;
            }
          );

          if (existingCombination) {
            return existingCombination;
          }

          // Yeni kombinasyon oluştur
          return createNewVariantCombination(combination);
        }
      );

      return newCombinations;
    }

    case "REORDER": {
      if (!action.variants) return existingCombinations;

      // Sıralama değişikliği kombinasyonları etkilemez, mevcut kombinasyonları koru
      return existingCombinations;
    }

    case "ADD":
    default: {
      if (!action.variant) return existingCombinations;

      const otherVariants = selectedVariants.filter(
        (v) => v.uniqueId !== action.variant!.uniqueId
      );
      return generateCombination(
        otherVariants,
        existingCombinations,
        action.variant
      );
    }
  }
}
