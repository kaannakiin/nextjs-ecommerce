import PageHeaderSearchInput from "@/app/(admin)/_components/PageHeaderSearchInput";
import { Button, Group, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import CategoryTable from "./_components/CategoryTable";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";
import { SearchParams } from "@/types/globalTypes";

export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    translations: {
      where: {
        locale: "TR";
      };
    };
    image: true;
    parentCategory: {
      include: {
        translations: {
          where: {
            locale: "TR";
          };
        };
      };
    };
    _count: {
      select: {
        childCategories: true;
        products: true;
      };
    };
  };
}>;

interface SearchCategoriesParams {
  args: Prisma.CategoryFindManyArgs;
}

const searchCategories = async ({
  args,
}: SearchCategoriesParams): Promise<CategoryWithRelations[]> => {
  try {
    const categories = await prisma.category.findMany({
      ...args,
      include: {
        translations: {
          where: {
            locale: "TR",
          },
        },
        image: true,
        parentCategory: {
          include: {
            translations: {
              where: {
                locale: "TR",
              },
            },
          },
        },
        _count: {
          select: {
            childCategories: true,
            products: true,
          },
        },
      },
    });
    return categories || [];
  } catch (error) {
    console.error("Error searching categories:", error);
    return [];
  }
};

const CategoriesPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const searchKey = "search";
  const pageParams = await searchParams;
  const search = (pageParams[searchKey] as string) || null;
  const page = parseInt(pageParams.page as string, 10) || 1;

  const args: Prisma.CategoryFindManyArgs = {
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
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * 10,
    take: 10,
  };

  const categories = await searchCategories({ args });

  return (
    <div className="flex flex-col gap-4">
      <Group justify="space-between">
        <Title order={4}>Kategoriler</Title>
        <Group gap="md">
          <Button
            component={Link}
            href="/admin/products/definitions/categories/create"
            leftSection={<IconPlus size={24} />}
            radius="lg"
            variant="outline"
          >
            Yeni Kategori Ekle
          </Button>
          <PageHeaderSearchInput searchKey={searchKey} radius="lg" />
        </Group>
      </Group>
      <CategoryTable
        categories={categories.map((category) => ({
          name:
            category.translations.find((t) => t.locale === "TR")?.name ||
            category.translations[0]?.name ||
            "Bilinmiyor",
          id: category.id,
          parentCategory: {
            name:
              category.parentCategory?.translations.find(
                (t) => t.locale === "TR"
              )?.name || "Yok",
          },
          createdAt: category.createdAt,
        }))}
      />
    </div>
  );
};

export default CategoriesPage;
