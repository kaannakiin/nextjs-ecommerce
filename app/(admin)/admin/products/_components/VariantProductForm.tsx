"use client";

import CustomDropzone from "@/app/(admin)/_components/CustomDropzone";
import GlobalLoadingOverlay from "@/app/(admin)/_components/GlobalLoadingOverlay";
import { ProductType } from "@/app/generated/prisma";
import { getProductTypeLabel } from "@/lib/helper";
import { slugify } from "@/lib/slugify";
import {
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
  PRODUCT_ASSET_MEDIA_MIME_TYPES,
  VariantProduct,
  VariantProductSchema,
} from "@/schemas/product-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Grid,
  Group,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  CreateOrUpdateVariantProduct,
  DeleteImageFromProduct,
} from "../_actions/variant-product-action";
import CustomCategorySelect from "./CustomCategorySelect";
import GoogleTaxonomySelect from "./GoogleTaxonomySelect";
import SeoCard from "./SeoCard";
import VariantCard from "./VariantCard";
import { useEffect } from "react";
import { error } from "console";

interface VariantProductFormProps {
  defaultValues?: VariantProduct;
}

const VariantProductForm = ({ defaultValues }: VariantProductFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors, isDirty },
    setValue,
    watch,
  } = useForm<VariantProduct>({
    resolver: zodResolver(VariantProductSchema),
    defaultValues: defaultValues || {
      productType: "PHYSICAL",
      translations: [
        {
          locale: "TR",
          slug: "",
          name: "",
          metaTitle: null,
          metaDescription: null,
          description: null,
          shortDescription: null,
        },
      ],
      categoryIds: null,
      googleTaxonomyId: null,
      images: [],
      variants: [],
    },
  });
  const existingImages = watch("existingImages") || [];
  const { push } = useRouter();
  const onSubmit: SubmitHandler<VariantProduct> = async (
    data: VariantProduct
  ) => {
    try {
      const result = await CreateOrUpdateVariantProduct(data);

      if (result.success) {
        notifications.show({
          title: "Başarılı",
          message: result.message,
          position: "bottom-right",
          color: "green",
        });

        push("/admin/products");
      } else {
        notifications.show({
          position: "bottom-right",
          title: "Hata",
          message: result.message,
          color: "red",
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      notifications.show({
        position: "bottom-right",
        title: "Beklenmeyen Hata",
        message: "Bir hata oluştu. Lütfen tekrar deneyin.",
        color: "red",
      });
    }
  };
  useEffect(() => {
    if (errors) {
      Object.values(errors).forEach((error) => {
        notifications.show({
          message: error.message,
          position: "bottom-right",
          color: "red",
        });
      });
    }
  });

  return (
    <div className="flex flex-col gap-3">
      <GlobalLoadingOverlay visible={isSubmitting} />
      <Group justify="space-between" align="center">
        <Title order={4}>Varyant Ürün Formu</Title>
        <Group gap={"md"}>
          <Button variant="outline">Taslak Olarak Kaydet</Button>
          <Button
            type="button"
            disabled={!isDirty || isSubmitting}
            onClick={() => {
              handleSubmit(onSubmit)();
            }}
          >
            Kaydet
          </Button>
        </Group>
      </Group>
      <Grid>
        <Grid.Col span={{ xs: 12, sm: 8 }}>
          <Controller
            control={control}
            name="translations.0.name"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                onChange={(e) => {
                  field.onChange(e.currentTarget.value);
                  if (field.value) {
                    setValue(
                      "translations.0.slug",
                      slugify(e.currentTarget.value)
                    );
                  }
                }}
                error={fieldState.error?.message}
                label="Ürün Adı"
                withAsterisk
              />
            )}
          />
        </Grid.Col>
        <Grid.Col span={{ xs: 12, sm: 4 }}>
          <Controller
            control={control}
            name="productType"
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label="Ürün Tipi"
                error={fieldState.error?.message}
                withAsterisk
                allowDeselect={false}
                data={Object.values(ProductType).map((type) => ({
                  value: type,
                  label: getProductTypeLabel(type),
                }))}
              />
            )}
          />
        </Grid.Col>
      </Grid>
      <Controller
        control={control}
        name="images"
        render={({ field }) => (
          <CustomDropzone
            label="Ürün Resimleri"
            existingImages={existingImages || undefined}
            onRemoveExisting={async (index, imageUrl) => {
              await DeleteImageFromProduct(
                imageUrl,
                defaultValues?.uniqueId || ""
              ).then((result) => {
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
                  setValue("existingImages", updatedImages);
                } else {
                  notifications.show({
                    title: "Hata",
                    message: result.message,
                    position: "bottom-right",
                    color: "red",
                  });
                }
              });
            }}
            accept={PRODUCT_ASSET_MEDIA_MIME_TYPES}
            maxSize={PRODUCT_ASSET_MEDIA_MAX_SIZE}
            maxFiles={PRODUCT_ASSET_MAX_FILES}
            onDrop={(files) => {
              field.onChange(files);
            }}
            onRemove={(index) => {
              const currentFiles = field.value || [];
              const updatedFiles = currentFiles.filter((_, i) => i !== index);
              field.onChange(updatedFiles);
            }}
            value={field.value || []}
          />
        )}
      />
      <SimpleGrid cols={{ xs: 1, sm: 2 }}>
        <Controller
          control={control}
          name="googleTaxonomyId"
          render={({ field, fieldState }) => (
            <GoogleTaxonomySelect
              {...field}
              value={field.value || undefined}
              error={fieldState.error?.message}
              label="Google Ürün Kategorisi"
            />
          )}
        />
        <Controller
          control={control}
          name="brandId"
          render={({ field }) => (
            <Select
              {...field}
              label="Marka"
              nothingFoundMessage={
                <Stack gap={"md"} py="xl" justify="center" align="center">
                  <Text fw={700} fz="md">
                    Henüz marka eklenmemiş.
                  </Text>
                  <Button
                    onClick={() => {
                      push("/admin/products/definitions/brands/create");
                    }}
                    variant="light"
                  >
                    Marka Ekle
                  </Button>
                </Stack>
              }
            />
          )}
        />
      </SimpleGrid>
      <Controller
        control={control}
        name="categoryIds"
        render={({ field }) => (
          <CustomCategorySelect {...field} value={field.value || []} />
        )}
      />
      <VariantCard control={control} setValue={setValue} watch={watch} />
      <SeoCard
        control={control}
        metaDescriptionFieldName="translations.0.metaDescription"
        metaTitleFieldName="translations.0.metaTitle"
        slugFieldName="translations.0.slug"
      />
    </div>
  );
};

export default VariantProductForm;
