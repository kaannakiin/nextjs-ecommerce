import { Locale } from "@/app/generated/prisma";
import prisma from "@/lib/prisma";
import { SearchParams } from "@/types/globalTypes";
import { Button, Group, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import BrandTable from "./_components/BrandTable";
import PageHeaderSearchInput from "@/app/[locale]/(admin)/_components/PageHeaderSearchInput";

const getBrands = async (search?: string | null, page?: number) => {
  try {
    const brands = await prisma.productBrand.findMany({
      include: {
        translations: true,
        parentBrand: {
          include: {
            translations: true,
          },
        },
      },
      where: search
        ? {
            translations: {
              some: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          }
        : undefined,
      skip: page ? (page - 1) * 10 : 0,
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    return brands;
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
};

const formatBrandsForTable = (
  brands: any[], // Geçici olarak any kullanıyoruz tip sorunu çözülene kadar
  locale: Locale = Locale.TR
) => {
  return brands.map((brand) => {
    const translation = brand.translations?.find(
      (t: any) => t.locale === locale
    );
    const parentTranslation = brand.parentBrand?.translations?.find(
      (t: any) => t.locale === locale
    );

    return {
      id: brand.id,
      name: translation?.name || "Çeviri bulunamadı",
      parentName: parentTranslation?.name || "",
      createdAt: brand.createdAt,
    };
  });
};

const ProductBrandPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const searchKey = "brand";
  const pageParams = await searchParams;

  const search = (pageParams.search as string) || null;
  const page = parseInt(pageParams.page as string) || 1;

  const brands = await getBrands(search, page);
  const formattedBrands = formatBrandsForTable(brands);

  return (
    <div className="flex flex-col gap-4">
      <Group justify="space-between">
        <Title order={4}>Markalar</Title>
        <Group gap="md">
          <Button
            component={Link}
            href="/admin/products/definitions/brands/create"
            leftSection={<IconPlus size={24} />}
            radius="lg"
            variant="outline"
          >
            Yeni Marka Ekle
          </Button>
          <PageHeaderSearchInput searchKey={searchKey} radius="lg" />
        </Group>
      </Group>

      <BrandTable brands={formattedBrands} />
    </div>
  );
};

export default ProductBrandPage;
