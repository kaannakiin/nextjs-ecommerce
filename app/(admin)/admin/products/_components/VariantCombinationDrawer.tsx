"use client";

import CustomDropzone from "@/app/(admin)/_components/CustomDropzone";
import {
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
  PRODUCT_ASSET_MEDIA_MIME_TYPES,
  VariantProduct,
} from "@/schemas/product-schema";
import {
  Drawer,
  DrawerProps,
  NumberInput,
  SimpleGrid,
  TextInput,
} from "@mantine/core";
import {
  Control,
  Controller,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import SeoCard from "./SeoCard";
import { DeleteImageFromVariantCombination } from "../_actions/variant-product-action";
import { notifications } from "@mantine/notifications";

interface VariantCombinationDrawerProps
  extends Pick<DrawerProps, "opened" | "onClose"> {
  index: number;
  control: Control<VariantProduct>;
  watch: UseFormWatch<VariantProduct>;
  setValue: UseFormSetValue<VariantProduct>;
}

const VariantCombinationDrawer = ({
  opened,
  onClose,
  control,
  index,
  watch,
  setValue,
}: VariantCombinationDrawerProps) => {
  const existingImages = watch(`variants.${index}.existingImages`) || [];

  return (
    <Drawer.Root
      onClose={onClose}
      opened={opened}
      position="bottom"
      size={"lg"}
    >
      <Drawer.Overlay />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title></Drawer.Title>
          <Drawer.CloseButton />
        </Drawer.Header>
        <Drawer.Body>
          <SimpleGrid cols={{ xs: 1, md: 3 }}>
            <Controller
              control={control}
              name={`variants.${index}.prices.0.price`}
              render={({ field, fieldState }) => (
                <NumberInput
                  {...field}
                  label="Fiyat"
                  hideControls={true}
                  error={fieldState.error?.message}
                  decimalScale={2}
                  leftSection={"₺"}
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                  allowNegative={false}
                  thousandSeparator=","
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                />
              )}
            />
            <Controller
              control={control}
              name={`variants.${index}.prices.0.discountedPrice`}
              render={({ field, fieldState }) => (
                <NumberInput
                  {...field}
                  label="İndirimli Fiyat"
                  hideControls={true}
                  error={fieldState.error?.message}
                  decimalScale={2}
                  value={field.value ?? undefined}
                  leftSection={"₺"}
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                  allowNegative={false}
                  thousandSeparator=","
                />
              )}
            />
            <Controller
              control={control}
              name={`variants.${index}.prices.0.buyedPrice`}
              render={({ field, fieldState }) => (
                <NumberInput
                  {...field}
                  error={fieldState.error?.message}
                  hideControls
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                  leftSection={"₺"}
                  label="Alış Fiyatı"
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                  allowNegative={false}
                  thousandSeparator=","
                  decimalScale={2}
                />
              )}
            />
            <Controller
              control={control}
              name={`variants.${index}.sku`}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  label="SKU"
                  error={fieldState.error?.message}
                  value={field.value ?? ""}
                />
              )}
            />
            <Controller
              control={control}
              name={`variants.${index}.barcode`}
              render={({ field, fieldState }) => (
                <TextInput
                  {...field}
                  value={field.value ?? ""}
                  label="Barkod"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name={`variants.${index}.stock`}
              render={({ field, fieldState }) => (
                <NumberInput
                  hideControls
                  {...field}
                  error={fieldState.error?.message}
                  min={0}
                  max={Number.MAX_SAFE_INTEGER}
                  allowNegative={false}
                  thousandSeparator=","
                  label="Stok"
                  decimalScale={2}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                />
              )}
            />
          </SimpleGrid>
          <SeoCard
            control={control}
            metaDescriptionFieldName={`variants.${index}.translations.0.metaDescription`}
            metaTitleFieldName={`variants.${index}.translations.0.metaTitle`}
          />
          <Controller
            control={control}
            name={`variants.${index}.images`}
            render={({ field }) => (
              <CustomDropzone
                label="Ürün Resimleri"
                existingImages={existingImages}
                onRemoveExisting={async (index, imageUrl) => {
                  await DeleteImageFromVariantCombination(imageUrl).then(
                    (result) => {
                      if (result.success) {
                        notifications.show({
                          title: "Başarılı",
                          message: "Resim başarıyla silindi.",
                          position: "bottom-right",
                          color: "green",
                        });
                        const updatedImages = existingImages.filter(
                          (_, i) => i !== index
                        );
                        setValue(
                          `variants.${index ?? 0}.existingImages`,
                          updatedImages
                        );
                      } else {
                        notifications.show({
                          title: "Hata",
                          message: result.message,
                          position: "bottom-right",
                          color: "red",
                        });
                      }
                    }
                  );
                }}
                accept={PRODUCT_ASSET_MEDIA_MIME_TYPES}
                maxSize={PRODUCT_ASSET_MEDIA_MAX_SIZE}
                maxFiles={PRODUCT_ASSET_MAX_FILES}
                onDrop={(files) => {
                  field.onChange(files);
                }}
                onRemove={(index) => {
                  const currentFiles = field.value || [];
                  const updatedFiles = currentFiles.filter(
                    (_, i) => i !== index
                  );
                  field.onChange(updatedFiles);
                }}
                value={field.value || []}
              />
            )}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
};

export default VariantCombinationDrawer;
