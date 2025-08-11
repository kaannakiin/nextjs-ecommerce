import prisma from "@/lib/prisma";
import { Params } from "@/types/globalTypes";
import BasicProductForm from "../../_components/BasicProductForm";
import VariantProductForm from "../../_components/VariantProductForm";
import {
  BasicProduct,
  Variant,
  VariantProduct,
} from "@/schemas/product-schema";
import { url } from "inspector";
import { assert } from "console";

const ProductFormPage = async ({ params }: { params: Params }) => {
  const slug = (await params).slug;
  if (slug === "create-basic") {
    return <BasicProductForm />;
  } else if (slug === "create-variant") {
    return <VariantProductForm />;
  } else {
    const product = await prisma.product.findUnique({
      where: { id: slug },
      include: {
        prices: true,
        translations: true,
        categories: {
          select: {
            categoryId: true,
          },
        },
        variantCombinations: true,
        assets: {
          orderBy: {
            order: "asc",
          },
          select: {
            asset: {
              select: {
                url: true,
                type: true,
              },
            },
          },
        },
      },
    });
    if (!product) {
      return <div>Ürün Bulunamadı</div>;
    }
    if (
      !product.variantCombinations ||
      product.variantCombinations.length === 0
    ) {
      return (
        <BasicProductForm
          defaultValues={{
            prices: product.prices.map((price) => ({
              currency: price.currency,
              price: price.price,
              discountedPrice: price.discountedPrice,
              buyedPrice: price.buyedPrice,
            })),
            existingImages: product.assets.map((asset) => ({
              url: asset.asset.url,
              type: asset.asset.type,
            })) as BasicProduct["existingImages"],
            productType: product.type,
            stock: product.stock || 0,
            translations: product.translations.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              slug: translation.slug,
              description: translation.description,
              metaDescription: translation.metaDescription,
              metaTitle: translation.metaTitle,
              shortDescription: translation.shortDescription,
            })),
            brandId: product.brandId,
            categoryIds: product.categories.map(
              (category) => category.categoryId
            ),
            googleTaxonomyId: product.taxonomyCategoryId,
            uniqueId: product.id,
          }}
        />
      );
    }

    const selectedVariants = await prisma.productVariantGroup.findMany({
      where: {
        productId: product.id,
      },
      include: {
        variant: {
          select: {
            id: true,
            type: true,
            translations: true,
          },
        },
        availableOptions: {
          orderBy: { sortOrder: "asc" },
          where: {
            productVariantGroup: {
              productId: product.id,
            },
          },
          select: {
            variantOption: {
              select: {
                colorHex: true,
                id: true,
                value: true,
                translations: { select: { name: true, locale: true } },
                image: {
                  select: { url: true, type: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });
    const combinations = await prisma.productVariantCombination.findMany({
      where: {
        productId: product.id,
      },
      include: {
        variantOptions: {
          orderBy: {
            productVariantGroup: {
              order: "asc",
            },
          },
          select: {
            productVariantGroup: {
              select: {
                variantId: true,
              },
            },
            variantOption: {
              select: {
                id: true,
              },
            },
          },
        },
        prices: {
          select: {
            currency: true,
            price: true,
            discountedPrice: true,
            buyedPrice: true,
          },
        },
        translations: {
          select: {
            locale: true,
            description: true,
            shortDescription: true,
            metaTitle: true,
            metaDescription: true,
          },
        },
        images: {
          orderBy: {
            order: "asc",
          },
          select: {
            asset: {
              select: {
                url: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const defaultValues: VariantProduct = {
      variants: combinations.map((combination) => ({
        options: combination.variantOptions.map((option) => ({
          variantGroupId: option.productVariantGroup.variantId,
          variantOptionId: option.variantOption.id,
        })) as VariantProduct["variants"][number]["options"],
        prices: combination.prices.map((price) => ({
          currency: price.currency,
          price: price.price,
          discountedPrice: price.discountedPrice,
          buyedPrice: price.buyedPrice,
        })) as VariantProduct["variants"][number]["prices"],
        sku: combination.sku,
        barcode: combination.barcode || "",
        stock: combination.stock,
        images: [],
        existingImages: combination.images.map((image) => ({
          url: image.asset.url,
          type: image.asset.type,
        })) as VariantProduct["variants"][number]["existingImages"],
        translations: combination.translations.map((translation) => ({
          locale: translation.locale,
          description: translation.description,
          shortDescription: translation.shortDescription,
          metaTitle: translation.metaTitle,
          metaDescription: translation.metaDescription,
        })) as VariantProduct["variants"][number]["translations"],
      })) as VariantProduct["variants"],
      productType: product.type,
      existingImages: product.assets.map((asset) => ({
        url: asset.asset.url,
        type: asset.asset.type,
      })),
      translations: product.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
        description: translation.description,
        metaDescription: translation.metaDescription,
        metaTitle: translation.metaTitle,
        shortDescription: translation.shortDescription,
      })),
      brandId: product.brandId,
      categoryIds: product.categories.map((category) => category.categoryId),
      googleTaxonomyId: product.taxonomyCategoryId,
      uniqueId: product.id,
      images: [],
      selectedVariants: selectedVariants.map((variant) => ({
        translations: variant.variant.translations.map((translation) => ({
          name: translation.name,
          locale: translation.locale,
        })) as VariantProduct["selectedVariants"][number]["translations"],
        options: variant.availableOptions.map((option) => ({
          translations: option.variantOption.translations.map(
            (translation) => ({
              name: translation.name,
              locale: translation.locale,
            })
          ),
          value:
            variant.variant.type === "COLOR"
              ? option.variantOption.colorHex || "#000000"
              : option.variantOption.value,
          colorHex:
            variant.variant.type === "COLOR"
              ? option.variantOption.colorHex
              : null,
          uniqueId: option.variantOption.id,
          existingImages: option.variantOption.image,
          image: null,
        })) as VariantProduct["selectedVariants"][number]["options"],
        type: variant.variant.type,
        uniqueId: variant.variant.id,
      })) as VariantProduct["selectedVariants"],
    };
    return <VariantProductForm defaultValues={defaultValues} />;
  }
};

export default ProductFormPage;
