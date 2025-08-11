"use client";

import {
  fillPricesSelectedCurrency,
  updatePricesProductAndVariants,
} from "@/actions/helper-actions/currency-locale";
import GlobalLoadingOverlay from "@/app/(admin)/_components/GlobalLoadingOverlay";
import TableImage from "@/app/(admin)/_components/TableImage";
import { Currency } from "@/app/generated/prisma";
import { getCurrencyLabel } from "@/lib/helper";
import {
  CalculatedPrice,
  ProductCurrencyLocale,
  ProductCurrencyLocaleSchema,
  TCMBFillResponse,
} from "@/schemas/helperSchemas";
import { ActionResponse } from "@/types/globalTypes";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";

interface ExchangeRate {
  currency1: Currency;
  currency2: number;
}

interface TCMBResponse {
  date: string;
  bultenNo: string;
  exchangeRates: ExchangeRate[];
  lastUpdated: string;
}

interface CurrencyLocaleProductsFormProps {
  currency: Currency;
  mainCurrency: Currency;
  data: {
    products: any[];
    productVariants: any[];
  };
}

const CurrencyLocaleProductsForm = ({
  currency,
  data,
  mainCurrency,
}: CurrencyLocaleProductsFormProps) => {
  const [isTcmbFillLoading, setIsTcmbFillLoading] = useState(false);

  const {
    data: tcmbData,
    isLoading,
    error,
    isError,
    refetch,
    isPending,
  } = useQuery<TCMBResponse>({
    queryKey: ["tcmb-banknote-selling-rates"],
    queryFn: async () => {
      const response = await fetch("/api/admin/tcmb-prices", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
  });

  const formattedData = useMemo(() => {
    const items: any[] = [];

    data.products.forEach((product) => {
      const existingPrice = product.prices.find(
        (p: any) => p.currency === currency
      );

      items.push({
        uniqueId: product.id,
        isVariant: false,
        price: existingPrice || {
          currency: currency,
          price: 0,
          discountedPrice: null,
          buyedPrice: null,
        },
        _displayInfo: {
          name: product.translations[0]?.name || "İsimsiz Ürün",
          imageUrl: product.assets[0]?.asset.url || null,
          sku: null,
          variantInfo: null,
        },
      });
    });

    data.productVariants.forEach((variant) => {
      const existingPrice = variant.prices.find(
        (p: any) => p.currency === currency
      );

      const variantNames = variant.variantOptions
        .map((vo: any) => {
          const variantName =
            vo.variantOption.variant.translations[0]?.name ||
            vo.variantOption.variant.type;
          const optionName =
            vo.variantOption.translations[0]?.name || vo.variantOption.value;
          return `${variantName}: ${optionName}`;
        })
        .join(" | ");

      items.push({
        uniqueId: variant.id,
        isVariant: true,
        price: existingPrice || {
          currency: currency,
          price: 0,
          discountedPrice: null,
          buyedPrice: null,
        },
        _displayInfo: {
          name: variant.product.translations[0]?.name || "İsimsiz Ürün",
          imageUrl:
            variant.images[0]?.asset.url ||
            variant.product.assets[0]?.asset.url ||
            null,
          sku: variant.sku,
          variantInfo: variantNames,
        },
      });
    });

    return items;
  }, [data.products, data.productVariants, currency]);

  const { replace, refresh } = useRouter();
  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<ProductCurrencyLocale>({
    resolver: zodResolver(ProductCurrencyLocaleSchema),
    defaultValues: {
      items: formattedData,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    reset({ items: formattedData });
  }, [currency, formattedData, reset]);

  const onClickTcmbFill = async () => {
    setIsTcmbFillLoading(true);
    try {
      const result: ActionResponse & { data?: TCMBFillResponse } =
        await fillPricesSelectedCurrency(currency);

      if (result.success && result.data) {
        const { calculatedPrices }: TCMBFillResponse = result.data;

        // Hesaplanan fiyatları form'a yükle
        const currentFormData = watch("items");
        const updatedFormData = currentFormData.map((item: any) => {
          const calculatedItem: CalculatedPrice | undefined =
            calculatedPrices.find(
              (calc: CalculatedPrice) =>
                calc.uniqueId === item.uniqueId &&
                calc.isVariant === item.isVariant
            );

          if (calculatedItem) {
            return {
              ...item,
              price: calculatedItem.price,
            };
          }
          return item;
        });

        reset({ items: updatedFormData });

        notifications.show({
          title: "TCMB Verileri Yüklendi",
          message: result.message,
          color: "green",
        });
      } else {
        notifications.show({
          title: "TCMB Hatası",
          message: result.message || "Fiyatlar hesaplanırken hata oluştu.",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Beklenmeyen Hata",
        message: "TCMB verileri alınırken beklenmeyen bir hata oluştu.",
        color: "red",
      });
    } finally {
      setIsTcmbFillLoading(false);
    }
  };

  const onSubmit: SubmitHandler<ProductCurrencyLocale> = async (formData) => {
    try {
      const result = await updatePricesProductAndVariants(formData);

      if (result.success) {
        notifications.show({
          title: "Başarılı",
          message: result.message || "Fiyatlar başarıyla güncellendi.",
          color: "green",
        });
        refresh();
      } else {
        notifications.show({
          title: "Hata",
          message: result.message || "Fiyatlar güncellenirken hata oluştu.",
          color: "red",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Beklenmeyen Hata",
        message: "Fiyatlar güncellenirken beklenmeyen bir hata oluştu.",
        color: "red",
      });
    }
  };

  if (isLoading || isPending) {
    return <GlobalLoadingOverlay visible />;
  }

  if (isError) {
    return (
      <div>
        <p>Kurlar yüklenirken hata oluştu: {error?.message}</p>
        <Button variant="default" onClick={() => refetch()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <GlobalLoadingOverlay visible={isSubmitting || isTcmbFillLoading} />
      <div className="flex flex-col gap-4">
        <Group justify="space-between">
          <Stack gap={"xs"}>
            <Text fz={"sm"} fw={700}>
              Ana Para Birimi : {getCurrencyLabel(mainCurrency)}
            </Text>
            <Select
              label="Para Birimi"
              value={currency}
              allowDeselect={false}
              disabled={isTcmbFillLoading}
              onChange={(value) => {
                if (!value || value === currency) return;
                const newParams = new URLSearchParams(searchParams.toString());
                newParams.set("currency", value);
                replace(`?${newParams.toString()}`);
              }}
              data={Object.values(Currency).map((curr) => ({
                value: curr,
                label: getCurrencyLabel(curr),
              }))}
            />
          </Stack>
          {tcmbData && (
            <Stack gap={"xs"}>
              <Button
                variant="light"
                onClick={onClickTcmbFill}
                loading={isTcmbFillLoading}
                disabled={mainCurrency === currency}
              >
                TCMB Verileri ile Doldur
              </Button>
              {mainCurrency === currency && (
                <Text size="xs" c="red">
                  Ana para biriminde TCMB verileri kullanılamaz
                </Text>
              )}
              <Text size="xs" c="dimmed">
                Son güncelleme:{" "}
                {new Date(tcmbData.lastUpdated).toLocaleString("tr-TR")}
              </Text>
            </Stack>
          )}
        </Group>

        <Box style={{ overflowX: "auto" }}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: "80px" }}>Resim</Table.Th>
                <Table.Th style={{ minWidth: "200px" }}>
                  Ürün Bilgileri
                </Table.Th>
                <Table.Th style={{ width: "150px" }}>
                  Fiyat ({currency})
                </Table.Th>
                <Table.Th style={{ width: "150px" }}>
                  İndirimli Fiyat ({currency})
                </Table.Th>
                <Table.Th style={{ width: "150px" }}>
                  Alış Fiyatı ({currency})
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {fields.map((field, index) => {
                const displayInfo = (field as any)._displayInfo;

                return (
                  <Table.Tr key={field.id}>
                    <Table.Td>
                      <TableImage
                        url={displayInfo?.imageUrl}
                        alt="ProductImages"
                      />
                    </Table.Td>

                    <Table.Td>
                      <div className="flex flex-col gap-1">
                        <Text fw={500} size="sm">
                          {displayInfo?.name}
                        </Text>

                        <div className="flex flex-wrap gap-1">
                          <Badge
                            size="xs"
                            variant="outline"
                            color={field.isVariant ? "orange" : "green"}
                          >
                            {field.isVariant ? "Varyant" : "Basit Ürün"}
                          </Badge>
                        </div>

                        {field.isVariant && (
                          <>
                            {displayInfo?.sku && (
                              <Text size="xs" c="dimmed">
                                SKU: {displayInfo.sku}
                              </Text>
                            )}
                            {displayInfo?.variantInfo && (
                              <Text size="xs" c="blue">
                                {displayInfo.variantInfo}
                              </Text>
                            )}
                          </>
                        )}
                      </div>
                    </Table.Td>

                    <Table.Td>
                      <Controller
                        name={`items.${index}.price.price`}
                        control={control}
                        render={({ field: priceField, fieldState }) => (
                          <NumberInput
                            {...priceField}
                            placeholder="0.00"
                            min={0}
                            decimalScale={2}
                            fixedDecimalScale
                            allowNegative={false}
                            hideControls
                            size="sm"
                            disabled={isTcmbFillLoading}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </Table.Td>

                    <Table.Td>
                      <Controller
                        name={`items.${index}.price.discountedPrice`}
                        control={control}
                        render={({ field: discountField, fieldState }) => (
                          <NumberInput
                            {...discountField}
                            value={discountField.value || undefined}
                            onChange={(val) =>
                              discountField.onChange(val || null)
                            }
                            placeholder="0.00"
                            min={0}
                            decimalScale={2}
                            fixedDecimalScale
                            allowNegative={false}
                            hideControls
                            size="sm"
                            disabled={isTcmbFillLoading}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </Table.Td>

                    <Table.Td>
                      <Controller
                        name={`items.${index}.price.buyedPrice`}
                        control={control}
                        render={({ field: buyedField, fieldState }) => (
                          <NumberInput
                            {...buyedField}
                            value={buyedField.value || undefined}
                            onChange={(val) => buyedField.onChange(val || null)}
                            placeholder="0.00"
                            min={0}
                            decimalScale={2}
                            fixedDecimalScale
                            allowNegative={false}
                            hideControls
                            size="sm"
                            disabled={isTcmbFillLoading}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Box>

        {fields.length === 0 && (
          <Text ta="center" c="dimmed" py="xl">
            {getCurrencyLabel(currency)} para biriminde fiyatlandırılmış ürün
            bulunamadı.
          </Text>
        )}

        <Group justify="flex-end" mt="xl">
          <Button
            variant="outline"
            onClick={() => reset()}
            disabled={isTcmbFillLoading}
          >
            Sıfırla
          </Button>
          <Button
            type="submit"
            disabled={fields.length === 0 || isTcmbFillLoading}
            loading={isSubmitting}
          >
            Fiyatları Kaydet
          </Button>
        </Group>
      </div>
    </form>
  );
};

export default CurrencyLocaleProductsForm;
