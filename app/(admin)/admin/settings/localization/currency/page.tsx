import {
  getLocaleCurrencyDefaultValues,
  getProductAndVariantPricesForLocaleCurrency,
} from "@/actions/helper-actions/currency-locale";
import { Currency, Locale } from "@/app/generated/prisma";
import { getCurrencyLabel } from "@/lib/helper";
import { SearchParams } from "@/types/globalTypes";
import { Group, Text } from "@mantine/core";
import Link from "next/link";
import CurrencyLocaleMapModal from "./_components/CurrencyLocaleMapModal";
import CurrencyLocaleProductsForm from "./_components/CurrencyLocaleProductsForm";

const CurrencyPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const defaultValues = await getLocaleCurrencyDefaultValues();
  const pageParams = await searchParams;
  const locale = (pageParams.locale as Locale) || "TR";
  const currency = (pageParams.currency as Currency) || "TRY";

  const products = await getProductAndVariantPricesForLocaleCurrency(
    currency,
    locale
  );

  return (
    <div className="flex flex-col gap-3">
      <Group justify="space-between" align="start" gap={"xl"} wrap="wrap">
        <div className="flex flex-col gap-1 flex-1 min-w-0 max-w-3xl">
          <Text fz={"sm"} c="dimmed">
            Desteklenen para birimlerimiz:{" "}
            {Object.values(Currency)
              .map((currency) => getCurrencyLabel(currency))
              .join(", ")}
          </Text>
          <Text fz={"sm"} c="dimmed">
            Otomatik güncellemeler,{" "}
            <Link
              href={"https://www.tcmb.gov.tr/kurlar/today.xml"}
              className="hover:!text-black hover:underline"
              target="_blank"
            >
              TCMB Döviz Kurları{" "}
            </Link>{" "}
            (Efektif Satış) üzerinden güncellenmektedir.
          </Text>
          <Text fz={"sm"} c={"dimmed"}>
            Seçeceğiniz dil - para birimi kombinasyonu üzerinden gösterim
            sağlanır. Eğer ürününüz para birimine ait bir fiyatlandırma yoksa,
            herhangi bir fiyatlandırma yapılmamaktadır. Ürününüz pazaryerinizde
            gösterilmeyecektir.
          </Text>
          <Text fz={"sm"} c={"dimmed"}>
            Otomatik fiyatlar ana para biriminiz üzerinden hesaplanır ve
            otomatik işlenir.
            <br />
            Örneğin, ana para biriminiz TRY ise, ürününüzün fiyatı 100 TRY ise,
            EUR fiyatı otomatik olarak güncel kurdan hesaplanır. (100 TRY ÷
            EUR/TRY kuru)
            <br />
            Eğer ana para biriminiz EUR ise, ürününüzün fiyatı 100 EUR ise, TRY
            fiyatı otomatik olarak güncel kurdan hesaplanır. (100 EUR × EUR/TRY
            kuru)
          </Text>
        </div>
        <div className="flex-shrink-0">
          <CurrencyLocaleMapModal defaultValues={defaultValues} />
        </div>
      </Group>
      <CurrencyLocaleProductsForm
        currency={currency}
        data={products}
        mainCurrency={defaultValues.mainCurrency}
      />
    </div>
  );
};

export default CurrencyPage;
