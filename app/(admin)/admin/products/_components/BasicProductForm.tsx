"use client";

import CustomDropzone from "@/app/(admin)/_components/CustomDropzone";
import { CustomRichTextWrapper } from "@/app/(admin)/_components/CustomRichTextWrapper";
import GlobalLoadingOverlay from "@/app/(admin)/_components/GlobalLoadingOverlay";
import { ProductType } from "@/app/generated/prisma";
import { getProductTypeLabel } from "@/lib/helper";
import { slugify } from "@/lib/slugify";
import {
  BasicProduct,
  BasicProductSchema,
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
  PRODUCT_ASSET_MEDIA_MIME_TYPES,
} from "@/schemas/product-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  TextInput,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  DeleteImageFromProduct,
  UpdateOrDeleteBasicProduct,
} from "../_actions/variant-product-action";
import CustomBrandSelect from "./CustomBrandSelect";
import CustomCategorySelect from "./CustomCategorySelect";
import GoogleTaxonomySelect from "./GoogleTaxonomySelect";
import SeoCard from "./SeoCard";

interface BasicProductFormProps {
  defaultValues?: BasicProduct;
}

const BasicProductForm = ({ defaultValues }: BasicProductFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { isDirty, isSubmitting },
    setValue,
    watch,
  } = useForm<BasicProduct>({
    resolver: zodResolver(BasicProductSchema),
    defaultValues: defaultValues || {
      productType: "PHYSICAL",
      translations: [
        {
          locale: "TR",
          name: "",
          slug: "",
          description: null,
          shortDescription: null,
          metaDescription: null,
          metaTitle: null,
        },
      ],
      prices: [{ currency: "TRY", price: 0, discountedPrice: null }],
    },
  });
  const existingImages = watch("existingImages") || [];
  const { push } = useRouter();
  const onSubmit: SubmitHandler<BasicProduct> = async (data) => {
    try {
      await UpdateOrDeleteBasicProduct(data).then((res) => {
        if (res.success) {
          notifications.show({
            title: "Başarılı",
            message: res.message || "Ürün başarıyla kaydedildi.",
            color: "green",
          });
          push(`/admin/products`);
        } else {
          notifications.show({
            title: "Hata",
            message: res.message || "Ürün kaydedilirken bir hata oluştu.",
            color: "red",
          });
        }
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      notifications.show({
        title: "Hata",
        message: "Ürün kaydedilirken bir hata oluştu.",
        color: "red",
      });
    }
  };

  return (
    <div>
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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <SimpleGrid cols={{ xs: 1, md: 3 }} my={"md"}>
          <Controller
            control={control}
            name="translations.0.name"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                label="Ürün Adı"
                onChange={(e) => {
                  field.onChange(e);
                  setValue(
                    "translations.0.slug",
                    slugify(e.currentTarget.value)
                  );
                }}
                error={fieldState.error?.message}
                withAsterisk
              />
            )}
          />
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
          <Controller
            control={control}
            name="prices.0.price"
            render={({ field, fieldState }) => (
              <NumberInput
                {...field}
                hideControls
                error={fieldState.error?.message}
                leftSection={"₺"}
                min={0}
                max={Number.MAX_SAFE_INTEGER}
                allowNegative={false}
                thousandSeparator=","
                decimalScale={2}
                label="Fiyat"
                withAsterisk
              />
            )}
          />
          <Controller
            control={control}
            name="prices.0.discountedPrice"
            render={({ field, fieldState }) => (
              <NumberInput
                {...field}
                hideControls
                error={fieldState.error?.message}
                leftSection={"₺"}
                min={0}
                label="İndirimli Fiyat"
                value={field.value || undefined}
                max={Number.MAX_SAFE_INTEGER}
                allowNegative={false}
                thousandSeparator=","
                decimalScale={2}
              />
            )}
          />
          <Controller
            control={control}
            name="prices.0.buyedPrice"
            render={({ field, fieldState }) => (
              <NumberInput
                {...field}
                hideControls
                error={fieldState.error?.message}
                leftSection={"₺"}
                min={0}
                label="Alış Fiyat"
                value={field.value || undefined}
                max={Number.MAX_SAFE_INTEGER}
                allowNegative={false}
                thousandSeparator=","
                decimalScale={2}
              />
            )}
          />
          <Controller
            control={control}
            name="stock"
            render={({ field, fieldState }) => (
              <NumberInput
                max={Number.MAX_SAFE_INTEGER}
                allowNegative={false}
                thousandSeparator=","
                decimalScale={0}
                label="Stok"
                withAsterisk
                hideControls
                {...field}
                error={fieldState.error?.message}
                min={0}
              />
            )}
          />
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
              <CustomBrandSelect {...field} value={field.value || undefined} />
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
        <Controller
          control={control}
          name="translations.0.description"
          render={({ field, fieldState }) => (
            <div className="my-4">
              <CustomRichTextWrapper
                label="Ürün Açıklaması"
                value={field.value || ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
              {fieldState.error && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <CustomDropzone
              label="Ürün Resimleri"
              accept={PRODUCT_ASSET_MEDIA_MIME_TYPES}
              maxSize={PRODUCT_ASSET_MEDIA_MAX_SIZE}
              existingImages={existingImages}
              onRemoveExisting={async (index, imageUrl) => {
                if (!imageUrl) return;
                if (!defaultValues?.uniqueId) return;
                await DeleteImageFromProduct(
                  imageUrl,
                  defaultValues?.uniqueId
                ).then((res) => {
                  if (res.success) {
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
                      message: res.message,
                      position: "bottom-right",
                      color: "red",
                    });
                  }
                });
              }}
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
        <SeoCard
          control={control}
          slugFieldName="translations.0.slug"
          metaDescriptionFieldName="translations.0.metaDescription"
          metaTitleFieldName="translations.0.metaTitle"
        />
      </form>
    </div>
  );
};

export default BasicProductForm;
