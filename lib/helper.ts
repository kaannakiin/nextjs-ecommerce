import {
  AssetType,
  Currency,
  Locale,
  ProductType,
} from "@/app/generated/prisma";
import {
  ProductPrice,
  Variant,
  VariantProduct,
} from "@/schemas/product-schema";
import { createId } from "@paralleldrive/cuid2";
import { DateArg, format } from "date-fns";
import { tr } from "date-fns/locale";

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
export function getLocaleLabel(locale: Locale): string {
  switch (locale) {
    case "TR":
      return "Türkiye (TR)";
    case "EN":
      return "İngiltere (EN)";
    case "DE":
      return "Almanya (DE)";
    default:
      return "Bilinmiyor";
  }
}

export function getCurrencyLabel(currency: Currency): string {
  switch (currency) {
    case "TRY":
      return "Türk Lirası (TRY)";
    case "USD":
      return "Amerikan Doları (USD)";
    case "EUR":
      return "Euro (EUR)";
    case "AUD":
      return "Avustralya Doları (AUD)";
    case "DKK":
      return "Danimarka Kronu (DKK)";
    case "GBP":
      return "İngiliz Sterlini (GBP)";
    case "CHF":
      return "İsviçre Frangı (CHF)";
    case "SEK":
      return "İsveç Kronu (SEK)";
    case "CAD":
      return "Kanada Doları (CAD)";
    case "KWD":
      return "Kuveyt Dinarı (KWD)";
    case "NOK":
      return "Norveç Kronu (NOK)";
    case "SAR":
      return "Suudi Arabistan Riyali (SAR)";
    case "JPY":
      return "Japon Yeni (JPY)";
    default:
      return `${currency}`;
  }
}

// Sadece para birimi isimlerini döndüren fonksiyon
export function getCurrencyName(currency: Currency): string {
  switch (currency) {
    case "TRY":
      return "Türk Lirası";
    case "USD":
      return "Amerikan Doları";
    case "EUR":
      return "Euro";
    case "AUD":
      return "Avustralya Doları";
    case "DKK":
      return "Danimarka Kronu";
    case "GBP":
      return "İngiliz Sterlini";
    case "CHF":
      return "İsviçre Frangı";
    case "SEK":
      return "İsveç Kronu";
    case "CAD":
      return "Kanada Doları";
    case "KWD":
      return "Kuveyt Dinarı";
    case "NOK":
      return "Norveç Kronu";
    case "SAR":
      return "Suudi Arabistan Riyali";
    case "JPY":
      return "Japon Yeni";
    default:
      return currency;
  }
}

export function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case "TRY":
      return "TRY";
    case "USD":
      return "USD";
    case "EUR":
      return "EUR";
    case "AUD":
      return "AUD";
    case "DKK":
      return "DKK";
    case "GBP":
      return "GBP";
    case "CHF":
      return "CHF";
    case "SEK":
      return "SEK";
    case "CAD":
      return "CAD";
    case "KWD":
      return "KWD";
    case "NOK":
      return "NOK";
    case "SAR":
      return "SAR";
    case "JPY":
      return "JPY";
    default:
      return currency;
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

export function formatDateTR(date: DateArg<Date> & {}, formatStr: string) {
  return format(date, formatStr, { locale: tr });
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
