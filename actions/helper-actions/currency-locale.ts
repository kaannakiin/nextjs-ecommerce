"use server";

import { Currency, Locale } from "@/app/generated/prisma";
import { checkRolesForActions } from "@/lib/checkRoles";
import prisma from "@/lib/prisma";
import {
  CalculatedPrice,
  CurrencyLocaleMap,
  ExchangeRate,
  ProductCurrencyLocale,
  TCMBFillResponse,
} from "@/schemas/helperSchemas";
import { ActionResponse } from "@/types/globalTypes";
import { XMLParser } from "fast-xml-parser";

export async function updateLocaleCurrencyMap(
  formData: CurrencyLocaleMap
): Promise<ActionResponse> {
  const isAuth = await checkRolesForActions("admin_owner");
  if (!isAuth) {
    return {
      success: false,
      message: "Bu işlemi gerçekleştirmek için yetkiniz yok.",
    };
  }
  try {
    const { items } = formData;
    for (const item of items) {
      await prisma.currencyLocaleMap.upsert({
        where: {
          locale: item.locale,
        },
        create: {
          locale: item.locale,
          currency: item.currency,
        },
        update: {
          currency: item.currency,
        },
      });
    }
    const organization = await prisma.organization.findFirst({});
    await prisma.organization.update({
      where: { id: organization?.id || "" },
      data: {
        mainCurrency: formData.mainCurrency,
      },
    });
    return {
      success: true,
      message: "Para birimi ve dil kombinasyonu başarıyla güncellendi.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        "Para birimi ve dil kombinasyonu güncellenirken bir hata oluştu.",
    };
  }
}

export const getLocaleCurrencyDefaultValues =
  async (): Promise<CurrencyLocaleMap> => {
    const isAuth = await checkRolesForActions("admin_owner");
    if (!isAuth) {
      return { items: [], mainCurrency: "TRY" };
    }
    const dbCurrencyLocaleMap = await prisma.currencyLocaleMap.findMany();
    const mainCurrency =
      await getMainCurrencyForOrganizationOrCreateOrganization();
    return {
      items:
        dbCurrencyLocaleMap.length > 0
          ? dbCurrencyLocaleMap.map((item) => ({
              locale: item.locale,
              currency: item.currency,
            }))
          : [{ currency: "TRY", locale: "TR" }],
      mainCurrency,
    };
  };

export const getMainCurrencyForOrganizationOrCreateOrganization =
  async (): Promise<Currency> => {
    const organization = await prisma.organization.findFirst({});
    if (!organization) {
      await prisma.organization.create({
        data: {
          mainCurrency: "TRY",
        },
      });
      return "TRY";
    }
    return organization.mainCurrency;
  };

export const getLocaleCurrencyDbValues = async (): Promise<
  ActionResponse & { data: { locale: Locale; currency: Currency }[] }
> => {
  const dbCurrencyLocaleMap = await prisma.currencyLocaleMap.findMany();
  if (dbCurrencyLocaleMap.length === 0) {
    return {
      success: false,
      message: "Veritabanında para birimi ve dil kombinasyonu bulunamadı.",
      data: [
        {
          currency: "TRY",
          locale: "TR",
        },
        { locale: "EN", currency: "USD" },
        { locale: "DE", currency: "EUR" },
      ],
    };
  }
  return {
    success: true,
    data: dbCurrencyLocaleMap.map((item) => ({
      locale: item.locale as Locale,
      currency: item.currency as Currency,
    })),
    message: "Para birimi ve dil kombinasyonu başarıyla alındı.",
  };
};

export const getProductAndVariantPricesForLocaleCurrency = async (
  currency: Currency,
  locale: Locale = "TR"
) => {
  const products = await prisma.product.findMany({
    where: {
      variantCombinations: {
        none: {},
      },
    },
    select: {
      id: true,
      translations: {
        where: { locale },
        select: {
          name: true,
        },
      },
      prices: {
        where: { currency },
        select: {
          currency: true,
          buyedPrice: true,
          discountedPrice: true,
          price: true,
        },
      },
      assets: {
        orderBy: { order: "asc" },
        take: 1,
        select: {
          asset: {
            select: {
              url: true,
            },
          },
        },
      },
    },
  });

  // Varyantlı ürünler
  const productVariants = await prisma.productVariantCombination.findMany({
    select: {
      id: true,
      sku: true,
      product: {
        select: {
          id: true,
          translations: {
            where: { locale },
            select: {
              name: true,
            },
          },
          assets: {
            orderBy: { order: "asc" },
            take: 1,
            select: {
              asset: {
                select: {
                  url: true,
                },
              },
            },
          },
        },
      },
      prices: {
        where: { currency },
        select: {
          currency: true,
          buyedPrice: true,
          discountedPrice: true,
          price: true,
        },
      },
      images: {
        orderBy: { order: "asc" },
        take: 1,
        select: {
          asset: {
            select: {
              url: true,
            },
          },
        },
      },
      variantOptions: {
        select: {
          variantOption: {
            select: {
              id: true,
              value: true,
              colorHex: true,
              translations: {
                where: { locale },
                select: {
                  name: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  type: true,
                  translations: {
                    where: { locale },
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return { products, productVariants };
};
export const fillPricesSelectedCurrency = async (
  selectedCurrency: Currency
): Promise<
  ActionResponse & {
    data?: TCMBFillResponse;
  }
> => {
  try {
    const convertPrice = (
      amount: number,
      fromCurrency: Currency,
      toCurrency: Currency,
      exchangeRates: ExchangeRate[]
    ): number => {
      if (fromCurrency === toCurrency) return amount;

      if (fromCurrency === Currency.TRY) {
        const targetRate = exchangeRates.find(
          (rate) => rate.currency1 === toCurrency
        );
        if (!targetRate)
          throw new Error(`Exchange rate not found for ${toCurrency}`);
        return amount / targetRate.price;
      }

      if (toCurrency === Currency.TRY) {
        const sourceRate = exchangeRates.find(
          (rate) => rate.currency1 === fromCurrency
        );
        if (!sourceRate)
          throw new Error(`Exchange rate not found for ${fromCurrency}`);
        return amount * sourceRate.price;
      }

      const sourceRate = exchangeRates.find(
        (rate) => rate.currency1 === fromCurrency
      );
      const targetRate = exchangeRates.find(
        (rate) => rate.currency1 === toCurrency
      );

      if (!sourceRate || !targetRate) {
        throw new Error("Exchange rates not found");
      }

      const tryAmount = amount * sourceRate.price;
      return tryAmount / targetRate.price;
    };

    const mainCurrency =
      await getMainCurrencyForOrganizationOrCreateOrganization();

    const isAuth = await checkRolesForActions("admin_owner");
    if (!isAuth) {
      return {
        success: false,
        message: "Bu işlemi gerçekleştirmek için yetkiniz yok.",
      };
    }

    if (mainCurrency === selectedCurrency) {
      return {
        success: false,
        message:
          "Ana para biriminizle güncellemek istediğiniz para birimi aynı. Referans kullanamıyoruz.",
      };
    }

    const response = await fetch("https://www.tcmb.gov.tr/kurlar/today.xml");
    if (!response.ok) {
      return {
        success: false,
        message:
          "TCMB verilerine erişilemedi. Lütfen daha sonra tekrar deneyin.",
      };
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const json = parser.parse(xml);

    const tarihDate = json.Tarih_Date;
    const currencies = tarihDate.Currency || [];

    const isSupportedTCMBCurrency = (code: string): code is Currency => {
      return (
        Object.values(Currency).includes(code as Currency) &&
        code !== Currency.TRY
      );
    };

    const filteredRates: ExchangeRate[] = currencies
      .filter((currency: any) => {
        const banknoteSelling = parseFloat(currency.BanknoteSelling);
        const currencyCode = currency["@_CurrencyCode"];
        return (
          !isNaN(banknoteSelling) &&
          banknoteSelling > 0 &&
          isSupportedTCMBCurrency(currencyCode)
        );
      })
      .map((currency: any) => ({
        currency1: currency["@_CurrencyCode"] as Currency,
        price: parseFloat(currency.BanknoteSelling),
      }));

    const allRates: ExchangeRate[] = [
      { currency1: Currency.TRY, price: 1 },
      ...filteredRates,
    ];

    const productsWithMainCurrency = await prisma.product.findMany({
      where: {
        variantCombinations: { none: {} },
        prices: { some: { currency: mainCurrency } },
      },
      select: {
        id: true,
        prices: {
          where: { currency: mainCurrency },
          select: {
            price: true,
            discountedPrice: true,
            buyedPrice: true,
          },
        },
      },
    });

    const variantsWithMainCurrency =
      await prisma.productVariantCombination.findMany({
        where: {
          prices: { some: { currency: mainCurrency } },
        },
        select: {
          id: true,
          prices: {
            where: { currency: mainCurrency },
            select: {
              price: true,
              discountedPrice: true,
              buyedPrice: true,
            },
          },
        },
      });

    const calculatedPrices: CalculatedPrice[] = [];

    // Basit ürünler için fiyat hesaplama
    for (const product of productsWithMainCurrency) {
      const mainPrice = product.prices[0];
      if (!mainPrice) continue;

      try {
        const convertedPrice = convertPrice(
          mainPrice.price,
          mainCurrency,
          selectedCurrency,
          allRates
        );

        const convertedDiscountedPrice = mainPrice.discountedPrice
          ? convertPrice(
              mainPrice.discountedPrice,
              mainCurrency,
              selectedCurrency,
              allRates
            )
          : null;

        const convertedBuyedPrice = mainPrice.buyedPrice
          ? convertPrice(
              mainPrice.buyedPrice,
              mainCurrency,
              selectedCurrency,
              allRates
            )
          : null;

        calculatedPrices.push({
          uniqueId: product.id,
          isVariant: false,
          price: {
            currency: selectedCurrency,
            price: Math.round(convertedPrice * 100) / 100,
            discountedPrice: convertedDiscountedPrice
              ? Math.round(convertedDiscountedPrice * 100) / 100
              : null,
            buyedPrice: convertedBuyedPrice
              ? Math.round(convertedBuyedPrice * 100) / 100
              : null,
          },
        });
      } catch (error) {
        console.error(
          `Error converting price for product ${product.id}:`,
          error
        );
      }
    }

    // Varyant ürünler için fiyat hesaplama
    for (const variant of variantsWithMainCurrency) {
      const mainPrice = variant.prices[0];
      if (!mainPrice) continue;

      try {
        const convertedPrice = convertPrice(
          mainPrice.price,
          mainCurrency,
          selectedCurrency,
          allRates
        );

        const convertedDiscountedPrice = mainPrice.discountedPrice
          ? convertPrice(
              mainPrice.discountedPrice,
              mainCurrency,
              selectedCurrency,
              allRates
            )
          : null;

        const convertedBuyedPrice = mainPrice.buyedPrice
          ? convertPrice(
              mainPrice.buyedPrice,
              mainCurrency,
              selectedCurrency,
              allRates
            )
          : null;

        calculatedPrices.push({
          uniqueId: variant.id,
          isVariant: true,
          price: {
            currency: selectedCurrency,
            price: Math.round(convertedPrice * 100) / 100,
            discountedPrice: convertedDiscountedPrice
              ? Math.round(convertedDiscountedPrice * 100) / 100
              : null,
            buyedPrice: convertedBuyedPrice
              ? Math.round(convertedBuyedPrice * 100) / 100
              : null,
          },
        });
      } catch (error) {
        console.error(
          `Error converting price for variant ${variant.id}:`,
          error
        );
      }
    }

    const tcmbFillData: TCMBFillResponse = {
      calculatedPrices,
      exchangeRate: allRates.find((rate) => rate.currency1 === selectedCurrency)
        ?.price,
      mainCurrency,
      selectedCurrency,
    };

    return {
      success: true,
      message: `${calculatedPrices.length} ürün fiyatı hesaplandı. Onaylamak için "Fiyatları Kaydet" butonuna tıklayın.`,
      data: tcmbFillData,
    };
  } catch (error) {
    console.error("Error in fillPricesSelectedCurrency:", error);
    return {
      success: false,
      message: "Fiyatlar hesaplanırken hata oluştu.",
    };
  }
};
export const updatePricesProductAndVariants = async (
  formData: ProductCurrencyLocale
): Promise<ActionResponse> => {
  try {
    const isAuth = await checkRolesForActions("admin_owner");
    if (!isAuth) {
      return { success: false, message: "Yetkisiz Erişim" };
    }

    // Önce tüm ürün ve varyant isimlerini al
    const productIds = formData.items
      .filter((item) => !item.isVariant)
      .map((item) => item.uniqueId);
    const variantIds = formData.items
      .filter((item) => item.isVariant)
      .map((item) => item.uniqueId);

    const [products, variants] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          translations: {
            where: { locale: "TR" },
            select: { name: true },
          },
        },
      }),
      prisma.productVariantCombination.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          product: {
            select: {
              translations: {
                where: { locale: "TR" },
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    // İsim lookup map'i oluştur
    const productNameMap = new Map(
      products.map((p) => [p.id, p.translations[0]?.name || "İsimsiz Ürün"])
    );
    const variantNameMap = new Map(
      variants.map((v) => [
        v.id,
        v.product.translations[0]?.name || "İsimsiz Ürün",
      ])
    );

    const failedItems: string[] = [];
    let successCount = 0;

    for (const data of formData.items) {
      try {
        if (data.isVariant) {
          if (!variantNameMap.has(data.uniqueId)) {
            failedItems.push(`Varyant (ID: ${data.uniqueId}) - Bulunamadı`);
            continue;
          }

          await prisma.productVariantCombination.update({
            where: { id: data.uniqueId },
            data: {
              prices: {
                upsert: {
                  where: {
                    currency_combinationId: {
                      combinationId: data.uniqueId,
                      currency: data.price.currency,
                    },
                  },
                  create: {
                    price: data.price.price,
                    buyedPrice: data.price.buyedPrice,
                    discountedPrice: data.price.discountedPrice,
                    currency: data.price.currency,
                  },
                  update: {
                    buyedPrice: data.price.buyedPrice,
                    discountedPrice: data.price.discountedPrice,
                    price: data.price.price,
                  },
                },
              },
            },
          });
          successCount++;
        } else {
          if (!productNameMap.has(data.uniqueId)) {
            failedItems.push(`Ürün (ID: ${data.uniqueId}) - Bulunamadı`);
            continue;
          }

          await prisma.product.update({
            where: { id: data.uniqueId },
            data: {
              prices: {
                upsert: {
                  where: {
                    currency_productId: {
                      productId: data.uniqueId,
                      currency: data.price.currency,
                    },
                  },
                  create: {
                    price: data.price.price,
                    buyedPrice: data.price.buyedPrice,
                    discountedPrice: data.price.discountedPrice,
                    currency: data.price.currency,
                  },
                  update: {
                    buyedPrice: data.price.buyedPrice,
                    discountedPrice: data.price.discountedPrice,
                    price: data.price.price,
                  },
                },
              },
            },
          });
          successCount++;
        }
      } catch (itemError) {
        console.error(`Error updating item ${data.uniqueId}:`, itemError);

        const itemName = data.isVariant
          ? variantNameMap.get(data.uniqueId) || "İsimsiz Ürün"
          : productNameMap.get(data.uniqueId) || "İsimsiz Ürün";

        const itemType = data.isVariant ? "Varyant" : "Ürün";
        failedItems.push(`${itemName} (${itemType})`);
      }
    }

    // Sonuç mesajını oluştur
    if (failedItems.length === 0) {
      return {
        success: true,
        message: `${successCount} ürün/varyant fiyatı başarıyla güncellendi.`,
      };
    } else if (successCount === 0) {
      return {
        success: false,
        message: `Tüm fiyat güncellemeleri başarısız oldu. Başarısız olanlar: ${failedItems.join(
          ", "
        )}`,
      };
    } else {
      return {
        success: true,
        message: `${successCount} ürün/varyant başarıyla güncellendi. Başarısız olanlar: ${failedItems.join(
          ", "
        )}`,
      };
    }
  } catch (error) {
    console.error("Error in updatePricesProductAndVariants:", error);
    return {
      success: false,
      message: "Fiyatlar güncellenirken beklenmeyen bir hata oluştu.",
    };
  }
};
