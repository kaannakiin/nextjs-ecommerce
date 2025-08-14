"use client";
import {
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
  PRODUCT_ASSET_MEDIA_MIME_TYPES,
  VariantProduct,
} from "@/schemas/product-schema";
import { Drawer, DrawerProps, Stack } from "@mantine/core";
import { watch } from "fs";
import {
  Control,
  Controller,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { DeleteImageFromVariantCombination } from "../_actions/variant-product-action";
import { notifications } from "@mantine/notifications";
import CustomDropzone from "../../../_components/CustomDropzone";

interface VariantMediaDrawerProps
  extends Pick<DrawerProps, "opened" | "onClose"> {
  control: Control<VariantProduct>;
  selectedIndex: number[];
  openedIndex?: number;
  setValue: UseFormSetValue<VariantProduct>;
  watch: UseFormWatch<VariantProduct>;
}
const VariantMediaDrawer = ({
  opened,
  onClose,
  control,
  setValue,
  openedIndex,
  selectedIndex,
  watch,
}: VariantMediaDrawerProps) => {
  const existingImages =
    watch(`variants.${openedIndex ?? 0}.existingImages`) || [];
  return (
    <Drawer.Root
      transitionProps={{
        transition: "slide-left",
        duration: 300,
        timingFunction: "linear",
      }}
      opened={opened}
      onClose={onClose}
      position="right"
      size={"md"}
    >
      <Drawer.Overlay />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title fz={"lg"} fw={700}>
            <Stack gap={"xs"}>Görseller</Stack>
          </Drawer.Title>
          <Drawer.CloseButton />
        </Drawer.Header>
        <Drawer.Body>
          <Controller
            control={control}
            name={`variants.${openedIndex ?? 0}.images`}
            render={({ field }) => (
              <CustomDropzone
                label="Varyant Resmi"
                existingImages={existingImages || undefined}
                onDrop={(files) => {
                  field.onChange(files);
                  if (
                    !selectedIndex.some((indexed) => indexed === openedIndex)
                  ) {
                    return;
                  }
                  if (selectedIndex.length > 0) {
                    selectedIndex.forEach((indexed) => {
                      if (indexed !== openedIndex) {
                        setValue(`variants.${indexed}.images`, files, {
                          shouldDirty: true, // Formun "kirli" olduğunu belirt
                        });
                      }
                    });
                  }
                }}
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
                          `variants.${openedIndex ?? 0}.existingImages`,
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
                value={field.value || []}
                cols={1}
                onRemove={(index) => {
                  // Bu kısım zaten doğru, fonksiyonel güncelleme kullanıyor.
                  const updatedFiles = [...(field.value || [])];
                  updatedFiles.splice(index, 1);
                  field.onChange(updatedFiles);

                  // Çoklu seçim varsa, diğerlerinden de resmi kaldır
                  if (selectedIndex.length > 0) {
                    selectedIndex.forEach((indexed) => {
                      if (indexed !== openedIndex) {
                        setValue(`variants.${indexed}.images`, updatedFiles, {
                          shouldDirty: true,
                        });
                      }
                    });
                  }
                }}
              />
            )}
          />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  );
};

export default VariantMediaDrawer;
