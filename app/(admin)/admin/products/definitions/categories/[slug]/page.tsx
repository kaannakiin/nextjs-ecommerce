import { Params } from "@/types/globalTypes";
import CategoryForm from "./_components/CategoryForm";
import prisma from "@/lib/prisma";
import { getObject } from "@/actions/helper-actions/minio-actions";

const CategoriesFormPage = async ({ params }: { params: Params }) => {
  const slug = (await params).slug;
  if (slug === "create") {
    return <CategoryForm />;
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
