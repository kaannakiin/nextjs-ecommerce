import prisma from "@/lib/prisma";
import { Params } from "@/types/globalTypes";
import CategoryForm from "./_components/CategoryForm";

async function getAvailableParentCategories(excludeId?: string) {
  const allCategories = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale: "TR" },
        select: { name: true },
      },
      childCategories: true,
    },
  });

  if (!excludeId) {
    return allCategories.map((category) => ({
      id: category.id,
      name: category.translations[0]?.name || "İsimsiz Kategori",
    }));
  }

  // Circular reference'ı önlemek için descendant'ları bul
  const getDescendants = (categoryId: string, categories: any[]): string[] => {
    const children = categories.filter(
      (c) => c.parentCategoryId === categoryId
    );
    const descendants = [categoryId];

    for (const child of children) {
      descendants.push(...getDescendants(child.id, categories));
    }

    return descendants;
  };

  const excludeIds = getDescendants(excludeId, allCategories);

  return allCategories
    .filter((category) => !excludeIds.includes(category.id))
    .map((category) => ({
      id: category.id,
      name: category.translations[0]?.name || "İsimsiz Kategori",
    }));
}

const CategoriesFormPage = async ({ params }: { params: Params }) => {
  const slug = (await params).slug;
  const parentData = await getAvailableParentCategories(
    slug === "create" ? undefined : slug
  );
  if (slug === "create") {
    return <CategoryForm parentData={parentData} />;
  } else {
    const dbCategory = await prisma.category.findUnique({
      where: {
        id: slug,
      },
      include: {
        translations: true,
        parentCategory: {
          select: {
            id: true,
            translations: {
              where: {
                locale: "TR",
              },
              select: {
                name: true,
              },
            },
          },
        },
        image: {
          select: {
            url: true,
            type: true,
          },
        },
      },
    });
    if (!dbCategory) {
      return <div>Kategori bulunamadı</div>;
    }

    return (
      <CategoryForm
        parentData={parentData}
        defaultValues={{
          translations: dbCategory.translations.map((translatiion) => ({
            locale: translatiion.locale,
            name: translatiion.name,
            slug: translatiion.slug,
            description: translatiion.description,
            metaTitle: translatiion.metaTitle,
            metaDescription: translatiion.metaDescription,
          })),
          parentCategoryId: dbCategory.parentCategory
            ? dbCategory.parentCategory.id
            : null,
          uniqueId: dbCategory.id,
          image: null,
          existingImages: dbCategory.image ? dbCategory.image.url : null,
        }}
      />
    );
  }
};

export default CategoriesFormPage;
