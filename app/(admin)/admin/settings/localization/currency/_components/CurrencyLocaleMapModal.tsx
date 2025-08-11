"use client";

import { updateLocaleCurrencyMap } from "@/actions/helper-actions/currency-locale";
import { Currency, Locale } from "@/app/generated/prisma";
import { getCurrencyLabel, getLocaleLabel } from "@/lib/helper";
import {
  CurrencyLocaleMap,
  CurrencyLocaleMapSchema,
} from "@/schemas/helperSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionIcon, Button, Group, Modal, Select, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
interface CurrencyLocaleMapModalProps {
  defaultValues?: CurrencyLocaleMap;
}

const CurrencyLocaleMapModal = ({
  defaultValues,
}: CurrencyLocaleMapModalProps) => {
  const [opened, { open, close }] = useDisclosure();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<CurrencyLocaleMap>({
    defaultValues: defaultValues || {
      items: [{ currency: "TRY", locale: "TR" }],
      mainCurrency: "TRY",
    },
    resolver: zodResolver(CurrencyLocaleMapSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];

  const usedLocales = new Set(
    watchedItems.map((item) => item?.locale).filter(Boolean)
  );
  const unusedLocales = Object.values(Locale).filter(
    (locale) => !usedLocales.has(locale)
  );

  const handleAddCombination = () => {
    if (unusedLocales.length > 0) {
      append({
        locale: unusedLocales[0],
        currency: "TRY",
      });
    }
  };

  const getLocaleOptionsForIndex = (currentIndex: number) => {
    const otherUsedLocales = new Set(
      watchedItems
        .filter((_, index) => index !== currentIndex)
        .map((item) => item?.locale)
        .filter(Boolean)
    );

    return Object.values(Locale).map((locale) => ({
      value: locale,
      label: getLocaleLabel(locale),
      disabled: otherUsedLocales.has(locale),
    }));
  };
  const { refresh } = useRouter();
  const handleFormSubmit = async (data: CurrencyLocaleMap) => {
    await updateLocaleCurrencyMap(data).then((res) => {
      if (res.success) {
        notifications.show({
          title: "Başarılı",
          message: res.message,
          position: "bottom-right",
        });
        close();
        refresh();
      } else {
        notifications.show({
          title: "Hata",
          message: res.message,
          color: "red",
          position: "bottom-right",
        });
      }
    });
  };

  return (
    <>
      <Button variant="default" onClick={open}>
        Para Birimi Kombinasyonu
      </Button>

      <Modal
        title="Para Birimi Kombinasyonu"
        classNames={{
          title: "text-lg font-semibold",
        }}
        transitionProps={{
          transition: "scale",
          duration: 200,
        }}
        opened={opened}
        centered
        size="lg"
        onClose={close}
      >
        <Stack gap="lg">
          <Group justify="space-between" align="flex-end">
            <Controller
              control={control}
              name="mainCurrency"
              render={({ field, fieldState }) => (
                <Select
                  error={fieldState.error?.message}
                  {...field}
                  allowDeselect={false}
                  label="Ana Para Birimi"
                  data={Object.values(Currency).map((currency) => ({
                    value: currency,
                    label: getCurrencyLabel(currency),
                  }))}
                />
              )}
            />
            <Button
              type="button"
              disabled={isSubmitting || unusedLocales.length === 0}
              onClick={handleAddCombination}
            >
              Kombinasyon Ekle
            </Button>
          </Group>

          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end">
              <div className="flex-1">
                <Controller
                  control={control}
                  name={`items.${index}.locale`}
                  render={({ field: controllerField }) => (
                    <Select
                      {...controllerField}
                      label="Dil"
                      allowDeselect={false}
                      placeholder="Dil seçin"
                      data={getLocaleOptionsForIndex(index)}
                      error={errors.items?.[index]?.locale?.message}
                    />
                  )}
                />
              </div>

              <div className="flex-1">
                <Controller
                  control={control}
                  name={`items.${index}.currency`}
                  render={({ field: controllerField }) => (
                    <Select
                      {...controllerField}
                      label="Para Birimi"
                      placeholder="Para birimi seçin"
                      allowDeselect={false}
                      data={Object.values(Currency).map((currency) => ({
                        value: currency,
                        label: getCurrencyLabel(currency),
                      }))}
                      error={errors.items?.[index]?.currency?.message}
                    />
                  )}
                />
              </div>

              {fields.length > 1 && (
                <div className="flex-shrink-0">
                  <ActionIcon
                    variant="transparent"
                    color="red"
                    onClick={() => remove(index)}
                    size="lg"
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </div>
              )}
            </div>
          ))}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={close}>
              İptal
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(handleFormSubmit)}
              loading={isSubmitting}
            >
              Kaydet
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default CurrencyLocaleMapModal;
