"use client";

import { DeleteImage } from "@/actions/helper-actions/delete-image";
import { slugify } from "@/lib/slugify";
import {
  Category,
  CategorySchema,
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
} from "@/schemas/product-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Divider,
  Group,
  Select,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { IconCategory, IconInfoCircle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import SeoCard from "../../../../_components/SeoCard";
import { CategoryAction } from "../actions/CategoryAction";
import GlobalLoadingOverlay from "@/app/[locale]/(admin)/_components/GlobalLoadingOverlay";
import { CustomRichTextWrapper } from "@/app/[locale]/(admin)/_components/CustomRichTextWrapper";
import ObjectDeleteModal from "@/app/[locale]/(admin)/_components/ObjectDeleteModal";
import CustomDropzone from "@/app/[locale]/(admin)/_components/CustomDropzone";

interface CategoryFormProps {
  defaultValues?: Category;
  parentData: { name: string; id: string }[];
}
const CategoryForm = ({ defaultValues, parentData }: CategoryFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    setError,
  } = useForm<Category>({
    resolver: zodResolver(CategorySchema),
    defaultValues: defaultValues || {
      translations: [
        {
          locale: "TR",
          name: "",
          slug: "",
          description: null,
          metaTitle: null,
          metaDescription: null,
        },
      ],
    },
  });

  const { push, refresh } = useRouter();
  const onSubmit: SubmitHandler<Category> = async (data) => {
    try {
      const response = await CategoryAction(data);
      if (!response.success) {
        setError("root", {
          message: response.message,
        });
      } else {
        push("/admin/products/definitions/categories");
      }
    } catch (error) {
      setError("root", {
        message: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <GlobalLoadingOverlay visible={isSubmitting} />
      <Group justify={errors.root ? "space-between" : "flex-end"}>
        {errors.root && <Text c={"red"}>{errors.root.message}</Text>}
        <Button type="submit">{defaultValues ? "Güncelle" : "Ekle"}</Button>
      </Group>
      <div className="flex flex-col gap-6">
        <Title order={4}>Temel Bilgi</Title>
        <SimpleGrid cols={{ xs: 1, lg: 2 }}>
          <Controller
            control={control}
            name="translations.0.name"
            render={({ field, fieldState }) => (
              <TextInput
                {...field}
                onChange={(e) => {
                  field.onChange(e.currentTarget.value);
                  setValue(
                    "translations.0.slug",
                    slugify(e.currentTarget.value),
                    { shouldValidate: true }
                  );
                }}
                error={fieldState.error?.message}
                label="Kategori Adı"
              />
            )}
          />
          <Controller
            control={control}
            name="parentCategoryId"
            render={({ field, fieldState }) => (
              <Select
                {...field}
                error={fieldState.error?.message}
                data={parentData.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                label={
                  <div className="flex flex-row gap-1 items-center">
                    <Text fz={"sm"} fw={500}>
                      Ebeveyn Kategori
                    </Text>
                    <Tooltip
                      label="Bu kategori hangi ana kategorinin altında yer alacağını belirler. Boş bırakılırsa ana kategori olarak oluşturulur."
                      color="primary.9"
                    >
                      <IconInfoCircle size={16} />
                    </Tooltip>
                  </div>
                }
                nothingFoundMessage={
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <IconCategory size={40} className="text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        Kategori bulunamadı
                      </p>
                      <Button
                        size="xs"
                        variant="filled"
                        type="button"
                        onClick={() =>
                          push("/admin/products/definitions/categories/create")
                        }
                      >
                        Kategori Ekle
                      </Button>
                    </div>
                  </div>
                }
              />
            )}
          />
        </SimpleGrid>
        <Controller
          control={control}
          name="translations.0.description"
          render={({ field, fieldState }) => (
            <CustomRichTextWrapper
              label="Kategori Açıklaması"
              {...field}
              value={field.value || undefined}
              error={fieldState.error?.message}
            />
          )}
        />
        {defaultValues && defaultValues.existingImages ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 ">
              <Text fw={500} fz={"sm"}>
                Mevcut Resim
              </Text>
              <Divider />
            </div>
            <ObjectDeleteModal
              url={defaultValues.existingImages}
              type="IMAGE"
              onDelete={async () => {
                if (!defaultValues.existingImages) {
                  return {
                    success: false,
                    message: "Silinecek resim bulunamadı.",
                  };
                }
                return DeleteImage({ url: defaultValues.existingImages }).then(
                  (res) => {
                    if (res.success) {
                      setValue("image", null);
                      setValue("existingImages", null);
                      refresh();
                    }
                    return res;
                  }
                );
              }}
            />
          </div>
        ) : (
          <Controller
            control={control}
            name="image"
            render={({ field }) => (
              <CustomDropzone
                {...field}
                onDrop={(files) => {
                  field.onChange(files[0]);
                }}
                value={field.value ? [field.value] : null}
                label="Kategori Resimleri"
                accept={IMAGE_MIME_TYPE}
                maxSize={PRODUCT_ASSET_MEDIA_MAX_SIZE}
                maxFiles={PRODUCT_ASSET_MAX_FILES}
                onRemove={() => field.onChange(null)}
              />
            )}
          />
        )}
        <SeoCard
          control={control}
          metaDescriptionFieldName="translations.0.metaDescription"
          metaTitleFieldName="translations.0.metaTitle"
          slugFieldName="translations.0.slug"
        />
      </div>
    </form>
  );
};

export default CategoryForm;
