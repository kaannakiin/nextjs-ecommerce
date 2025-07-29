import { Params } from "@/types/globalTypes";
import BrandForm from "../_components/BrandForm";
import prisma from "@/lib/prisma";

async function getAvailableParentBrands(excludeId?: string) {
  const allBrands = await prisma.productBrand.findMany({
    include: {
      translations: {
        where: { locale: "TR" },
      },
      childBrands: true,
    },
  });

  if (!excludeId) {
    return allBrands;
  }

  const getDescendants = (brandId: string, brands: any[]): string[] => {
    const children = brands.filter((b) => b.parentBrandId === brandId);
    const descendants = [brandId];

    for (const child of children) {
      descendants.push(...getDescendants(child.id, brands));
    }

    return descendants;
  };

  const excludeIds = getDescendants(excludeId, allBrands);

  return allBrands.filter((brand) => !excludeIds.includes(brand.id));
}

const BrandFormPage = async ({ params }: { params: Params }) => {
  const slug = (await params).slug;
  const availableParentBrands = await getAvailableParentBrands(
    slug === "create" ? undefined : slug
  );

  if (slug === "create") {
    return (
      <BrandForm
        parentData={
          availableParentBrands
            ? availableParentBrands.map((brands) => ({
                id: brands.id,
                name: brands.translations[0]?.name || "No Name",
              }))
            : []
        }
      />
    );
  } else {
    const brand = await prisma.productBrand.findUnique({
      where: {
        id: slug,
      },
      include: {
        translations: true,
        image: true,
      },
    });

    if (!brand) {
      return <div>Marka Bulunamadı</div>;
    }
    return (
      <BrandForm
        parentData={
          availableParentBrands
            ? availableParentBrands.map((brands) => ({
                id: brands.id,
                name: brands.translations[0]?.name || "No Name",
              }))
            : []
        }
        defaultValues={{
          translations: brand.translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name,
            description: translation.description,
            slug: translation.slug,
            metaDescription: translation.metaDescription,
            metaTitle: translation.metaTitle,
          })),
          existingImages: brand.image
            ? {
                type: brand.image.type,
                url: brand.image.url,
              }
            : null,
          image: null,
          uniqueId: brand.id,
          parentBrandId: brand.parentBrandId,
        }}
      />
    );
  }
};

export default BrandFormPage;
