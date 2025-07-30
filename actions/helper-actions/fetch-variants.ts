"use server";

import prisma from "@/lib/prisma";
import { Variant } from "@/schemas/product-schema";

export async function fetchVariants(search: string): Promise<{
  success: boolean;
  variants?: Variant[];
}> {
  try {
    if (!search || search.length < 3 || search.trim() === "") {
      return { success: false };
    }

    const variants = await prisma.variant.findMany({
      where: {
        OR: [
          {
            translations: {
              some: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
          {
            translations: {
              some: {
                slug: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      },
      include: {
        options: {
          include: {
            translations: true,
            image: {
              select: {
                url: true,
                type: true,
              },
            },
          },
        },
        translations: true,
      },
    });

    if (variants && variants.length > 0) {
      return {
        success: true,
        variants: variants.map((variant) => ({
          uniqueId: variant.id,
          type: variant.type,
          translations: variant.translations.map((translation) => ({
            locale: translation.locale,
            name: translation.name,
            slug: translation.slug,
          })),
          options: variant.options.map((option) => ({
            uniqueId: option.id,
            value: option.value || "",
            translations: option.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
            })),
            existingImages: option.image
              ? {
                  url: option.image.url,
                  type: option.image.type,
                }
              : null,
          })),
        })),
      };
    }

    return { success: false };
  } catch (error) {
    console.error("Error fetching variants:", error);
    return { success: false };
  }
}
