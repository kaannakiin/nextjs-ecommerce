import { Currency, Locale } from "@/app/generated/prisma";
import * as z from "zod";
import { ProductPriceSchema } from "./product-schema";

export const CurrencyLocaleItemSchema = z.object({
  locale: z.enum(Locale),
  currency: z.enum(Currency),
});

export const CurrencyLocaleArraySchema = z
  .array(CurrencyLocaleItemSchema)
  .min(1, {
    message: "En az bir tane para birimi ve dil kombinasyonu gereklidir.",
  })
  .refine(
    (data) => {
      const uniqueLocales = new Set(data.map((item) => item.locale));
      return uniqueLocales.size === data.length;
    },
    {
      message: "Her dil sadece bir kere seçilebilir.",
    }
  );

export const CurrencyLocaleMapSchema = z.object({
  items: CurrencyLocaleArraySchema,
  mainCurrency: z.enum(Currency),
});

export type CurrencyLocaleItem = z.infer<typeof CurrencyLocaleItemSchema>;
export type CurrencyLocaleArray = z.infer<typeof CurrencyLocaleArraySchema>;
export type CurrencyLocaleMap = z.infer<typeof CurrencyLocaleMapSchema>;

export const ProductCurrencyLocaleSchema = z.object({
  items: z.array(
    z.object({
      uniqueId: z.cuid2(),
      isVariant: z.boolean(),
      price: ProductPriceSchema,
    })
  ),
});
export type ProductCurrencyLocale = z.infer<typeof ProductCurrencyLocaleSchema>;

export interface ExchangeRate {
  currency1: Currency;
  price: number;
}

export interface CalculatedPrice {
  uniqueId: string;
  isVariant: boolean;
  price: {
    currency: Currency;
    price: number;
    discountedPrice: number | null;
    buyedPrice: number | null;
  };
}

export interface TCMBFillResponse {
  calculatedPrices: CalculatedPrice[];
  exchangeRate?: number;
  mainCurrency: Currency;
  selectedCurrency: Currency;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: TCMBFillResponse;
}
