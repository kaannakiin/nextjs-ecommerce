"use server";

import prisma from "@/lib/prisma";
import { ActionResponse } from "@/types/globalTypes";

type CategoryTreeNode = {
  id: string;
  name: string;
  parentCategoryId: string | null;
  children: CategoryTreeNode[];
  depth: number;
};

export async function fetchCategoriesAsTree(): Promise<
  ActionResponse & {
    data: CategoryTreeNode[] | null;
  }
> {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        parentCategoryId: true,
        translations: {
          where: { locale: "TR" },
          select: { name: true },
        },
      },
    });

    if (!categories || categories.length === 0) {
      return {
        success: false,
        message: "No categories found.",
        data: null,
      };
    }

    const tree = buildCategoryTree(categories);

    return {
      success: true,
      message: "Kategoriler başarıyla alındı.",
      data: tree,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message: "Kategoriler alınırken bir hata oluştu.",
      data: null,
    };
  }
}

function buildCategoryTree(categories: any[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>();
  const tree: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    categoryMap.set(category.id, {
      id: category.id,
      name: category.translations[0]?.name || "Unnamed Category",
      parentCategoryId: category.parentCategoryId,
      children: [],
      depth: 0,
    });
  });

  // Tree yapısını oluştur
  categoryMap.forEach((category) => {
    if (category.parentCategoryId === null) {
      // Ana kategori
      tree.push(category);
    } else {
      // Alt kategori
      const parent = categoryMap.get(category.parentCategoryId);
      if (parent) {
        category.depth = parent.depth + 1;
        parent.children.push(category);
      }
    }
  });

  return tree;
}
