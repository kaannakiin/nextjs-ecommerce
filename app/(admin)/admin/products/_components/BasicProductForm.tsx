"use client";

import CustomDropzone from "@/app/(admin)/_components/CustomDropzone";
import { CustomRichTextWrapper } from "@/app/(admin)/_components/CustomRichTextWrapper";
import {
  BasicProduct,
  BasicProductSchema,
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
  PRODUCT_ASSET_MEDIA_MIME_TYPES,
} from "@/schemas/product-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { MultiSelect, Select, SimpleGrid } from "@mantine/core";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import GoogleTaxonomySelect from "./GoogleTaxonomySelect";
import SeoCard from "./SeoCard";

const BasicProductForm = () => {
  const { control, handleSubmit, watch } = useForm<BasicProduct>({
    resolver: zodResolver(BasicProductSchema),
    defaultValues: {
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
      prices: [
        { currency: "TRY", locale: "TR", price: 0, discountedPrice: null },
      ],
    },
  });

  const onSubmit: SubmitHandler<BasicProduct> = async (data) => {};

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          control={control}
          name="translations.0.description"
          render={({ field, fieldState }) => (
            <div>
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
        <SimpleGrid cols={{ xs: 1, md: 2 }}>
          <Controller
            control={control}
            name="googleTaxonomyId"
            render={({ field, fieldState }) => (
              <GoogleTaxonomySelect
                {...field}
                value={field.value || undefined}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="categoryIds"
            render={({ field }) => (
              <MultiSelect {...field} value={field.value || []} />
            )}
          />
        </SimpleGrid>
      </form>
    </div>
  );
};

export default BasicProductForm;
