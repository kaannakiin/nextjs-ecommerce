"use client";

import { DeleteImage } from "@/actions/helper-actions/delete-image";
import CustomDropzone from "@/app/(admin)/_components/CustomDropzone";
import GlobalLoadingOverlay from "@/app/(admin)/_components/GlobalLoadingOverlay";
import ObjectDeleteModal from "@/app/(admin)/_components/ObjectDeleteModal";
import { slugify } from "@/lib/slugify";
import {
  Brand,
  BrandSchema,
  PRODUCT_ASSET_MAX_FILES,
  PRODUCT_ASSET_MEDIA_MAX_SIZE,
} from "@/schemas/product-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Group,
  Select,
  SimpleGrid,
  TextInput,
  Title,
} from "@mantine/core";
import { IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { IconBrandMedium } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import SeoCard from "../../../_components/SeoCard";
import { BrandAction } from "../actions/BrandAction";
import { notifications } from "@mantine/notifications";

interface BrandFormProps {
  defaultValues?: Brand;
  parentData: { name: string; id: string }[];
}

const BrandForm = ({ defaultValues, parentData }: BrandFormProps) => {
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    setValue,
    setError,
  } = useForm<Brand>({
    resolver: zodResolver(BrandSchema),
    defaultValues: defaultValues || {
      image: null,
      existingImages: null,
      translations: [
        {
          locale: "TR",
          name: "",
          slug: "",
          description: null,
          metaDescription: null,
          metaTitle: null,
        },
      ],
    },
  });

  const { push, refresh } = useRouter();

  const onSubmit: SubmitHandler<Brand> = async (data) => {
    try {
      const response = await BrandAction(data).then((res) => {
        if (res.success) {
          notifications.show({
            title: "Başarılı",
            message: res.message || "Marka başarıyla işlendi",
            position: "bottom-right",
            color: "green",
            autoClose: true,
          });
          push("/admin/products/definitions/brands");
        } else if (!res.success) {
          notifications.show({
            title: "Hata",
            message: res.message || "Marka işlenirken bir hata oluştu",
            position: "bottom-right",
            color: "red",
            autoClose: true,
          });
        }
      });
    } catch (error) {
      console.error("Error in brand form submission:", error);
      notifications.show({
        title: "Hata",
        autoClose: true,
        message: "Bir hata oluştu, lütfen tekrar deneyin.",
        position: "bottom-right",
        color: "red",
      });

      setError("root", {
        message: "Bir hata oluştu, lütfen tekrar deneyin.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <GlobalLoadingOverlay visible={isSubmitting} />
      <Group justify="space-between">
        <Title order={4}>
          {defaultValues ? "Marka Güncelle" : "Yeni Marka Ekle"}
        </Title>
        <Button type="submit">{defaultValues ? "Güncelle" : "Ekle"}</Button>
      </Group>
      <SimpleGrid cols={{ xs: 1, sm: 2 }}>
        <Controller
          control={control}
          name="translations.0.name"
          render={({ field, fieldState }) => (
            <TextInput
              {...field}
              error={fieldState.error?.message}
              onChange={(e) => {
                field.onChange(e.currentTarget.value);
                setValue(
                  "translations.0.slug",
                  slugify(e.currentTarget.value),
                  { shouldValidate: true }
                );
              }}
              label="Marka Adı"
            />
          )}
        />
        <Controller
          control={control}
          name="parentBrandId"
          render={({ field, fieldState }) => (
            <Select
              error={fieldState.error?.message}
              label="Ebeveyn Marka"
              {...field}
              data={parentData.map((brand) => ({
                value: brand.id,
                label: brand.name,
              }))}
              nothingFoundMessage={
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <IconBrandMedium size={40} className="text-gray-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      Marka bulunamadı
                    </p>
                    <Button
                      size="xs"
                      variant="filled"
                      type="button"
                      onClick={() =>
                        push("/admin/products/definitions/brands/create")
                      }
                    >
                      Marka Ekle
                    </Button>
                  </div>
                </div>
              }
            />
          )}
        />
      </SimpleGrid>
      {defaultValues && defaultValues.existingImages ? (
        <ObjectDeleteModal
          type={defaultValues.existingImages.type}
          url={defaultValues.existingImages.url}
          onDelete={async () => {
            if (!defaultValues.existingImages) {
              return {
                success: false,
                message: "Silinecek resim bulunamadı.",
              };
            }
            return DeleteImage({ url: defaultValues.existingImages.url }).then(
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
              label="Marka Resmi"
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
        slugFieldName="translations.0.slug"
        metaDescriptionFieldName="translations.0.metaDescription"
        metaTitleFieldName="translations.0.metaTitle"
      />
    </form>
  );
};

export default BrandForm;
