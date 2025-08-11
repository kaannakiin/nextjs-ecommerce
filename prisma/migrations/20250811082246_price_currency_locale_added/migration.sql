-- CreateTable
CREATE TABLE "public"."CurrencyLocaleMap" (
    "id" TEXT NOT NULL,
    "locale" "public"."Locale" NOT NULL,
    "currency" "public"."Currency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyLocaleMap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyLocaleMap_locale_currency_key" ON "public"."CurrencyLocaleMap"("locale", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "CurrencyLocaleMap_locale_key" ON "public"."CurrencyLocaleMap"("locale");
