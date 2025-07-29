"use server";

import prisma from "@/lib/prisma";
import { TaxonomyCategoryWithChildren } from "@/types/globalTypes";

export async function getTaxonomyData(): Promise<
  TaxonomyCategoryWithChildren[]
> {
  const categories = await prisma.taxonomyCategory.findMany({
    where: { isActive: true },
    select: {
      id: true,
      googleId: true,
      parentId: true,
      path: true,
      pathNames: true,
      depth: true,
      originalName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { depth: "asc" },
  });

  const categoryMap: Record<string, TaxonomyCategoryWithChildren> = {};
  const roots: TaxonomyCategoryWithChildren[] = [];

  for (const category of categories) {
    const categoryWithChildren: TaxonomyCategoryWithChildren = {
      ...category,
      children: [],
    };
    categoryMap[category.id] = categoryWithChildren;
  }

  for (const category of categories) {
    const item = categoryMap[category.id];
    if (category.parentId && categoryMap[category.parentId]) {
      const parent = categoryMap[category.parentId];
      parent.children!.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}
