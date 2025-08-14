import CustomPagination from "@/app/_components/CustomPagination";
import {
  AssetType,
  Currency,
  Locale,
  ProductType,
} from "@/app/generated/prisma";
import prisma from "@/lib/prisma";
import { SearchParams } from "@/types/globalTypes";
import ProductHeader from "./_components/ProductHeader";
import ProductTable from "./_components/ProductTable";

export interface ProductWithDetails {
  id: string;
  type: ProductType;
  taxonomyCategoryId: string | null;
  brandId: string | null;
  createdAt: Date; // string yerine Date
  updatedAt: Date; // string yerine Date
  assets: {
    asset: {
      type: AssetType;
      url: string;
    };
  }[];
  translations: {
    name: string;
    locale: Locale;
  }[];
  categories: {
    category: {
      translations: {
        locale: Locale;
        name: string;
      }[];
    };
  }[];
  prices: {
    currency: Currency;
    price: number;
    discountedPrice: number | null;
    buyedPrice: number | null;
  }[];
  brand: {
    translations: {
      name: string;
      locale: Locale;
    }[];
  } | null;
  _count: {
    variantCombinations: number;
  };
  variantCombinations: {
    images: {
      asset: {
        url: string;
        type: AssetType;
      };
    }[];
    prices: {
      buyedPrice: number | null;
      currency: Currency;
      price: number;
      discountedPrice: number | null;
    }[];
  }[];
  taxonomyCategory: {
    originalName: string;
  } | null;
}

export interface ProcessedProduct {
  id: string;
  name: string;
  image: string | null;
  variantCount: number;
  minPrice: number;
  maxPrice: number;
  currency: Currency;
  brandName: string | null;
  categoryName: string | null;
}
const buildWhereCondition = (search: string | null) => {
  return {
    ...(search
      ? {
          translations: {
            some: {
              locale: "TR" as Locale, // Locale enum'ına cast et
              name: {
                contains: search,
                mode: "insensitive" as const, // Prisma mode tipini belirt
              },
            },
          },
        }
      : {}),
  };
};

const feedProducts = async (
  search: string | null,
  page: number,
  take: number
): Promise<ProductWithDetails[]> => {
  const skip = (page - 1) * take;
  const whereCondition = buildWhereCondition(search);

  const products = await prisma.product.findMany({
    where: whereCondition,
    skip: skip,
    take: take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      assets: {
        where: {
          asset: {
            type: "IMAGE",
          },
        },
        orderBy: {
          order: "asc",
        },
        take: 1,
        select: {
          asset: {
            select: {
              type: true,
              url: true,
            },
          },
        },
      },
      translations: {
        select: {
          name: true,
          locale: true,
        },
      },
      categories: {
        select: {
          category: {
            select: {
              translations: {
                select: {
                  locale: true,
                  name: true,
                },
              },
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
      brand: {
        select: {
          translations: {
            select: {
              name: true,
              locale: true,
            },
          },
        },
      },
      _count: {
        select: {
          variantCombinations: true,
        },
      },
      variantCombinations: {
        select: {
          images: {
            orderBy: {
              order: "asc",
            },
            where: {
              asset: {
                type: "IMAGE",
              },
            },
            take: 1,
            select: {
              asset: {
                select: {
                  url: true,
                  type: true,
                },
              },
            },
          },
          prices: {
            select: {
              buyedPrice: true,
              currency: true,
              price: true,
              discountedPrice: true,
            },
          },
        },
      },
      taxonomyCategory: {
        select: {
          originalName: true,
        },
      },
    },
  });

  return products as ProductWithDetails[];
};

// Toplam ürün sayısını almak için ayrı fonksiyon
const getProductsCount = async (search: string | null): Promise<number> => {
  const whereCondition = buildWhereCondition(search);

  return await prisma.product.count({
    where: whereCondition,
  });
};

const processProducts = (
  products: ProductWithDetails[]
): ProcessedProduct[] => {
  return products.map((product) => {
    const name =
      product.translations.find((t) => t.locale === Locale.TR)?.name || // Enum kullan
      product.translations[0]?.name ||
      "Ürün adı yok";

    // Resim al - önce product assets'inden, yoksa variant'lardan
    let image: string | null = null;
    // 1. Ana product'tan kontrol et
    if (product.assets && product.assets.length > 0) {
      image = product.assets[0].asset.url;
    }
    // 2. Ana product'ta yoksa variant'lardan al
    else {
      for (const variant of product.variantCombinations) {
        if (variant.images && variant.images.length > 0) {
          image = variant.images[0].asset.url;
          break;
        }
      }
    }
    // Fiyat hesaplamaları
    const allPrices: number[] = [];
    let currency: Currency = Currency.TRY; // Enum kullan

    // Variant fiyatlarını topla
    product.variantCombinations.forEach((variant) => {
      variant.prices.forEach((priceObj) => {
        currency = priceObj.currency;
        const effectivePrice = priceObj.discountedPrice || priceObj.price;
        allPrices.push(effectivePrice);
      });
    });

    // Product level fiyatları da ekle (eğer varsa)
    product.prices.forEach((priceObj) => {
      currency = priceObj.currency;
      const effectivePrice = priceObj.discountedPrice || priceObj.price;
      allPrices.push(effectivePrice);
    });

    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

    // Brand adı al
    const brandName =
      product.brand?.translations.find((t) => t.locale === Locale.TR)?.name || // Enum kullan
      product.brand?.translations[0]?.name ||
      null;

    // Kategori adı al
    const categoryName =
      product.categories[0]?.category.translations.find(
        (t) => t.locale === Locale.TR // Enum kullan
      )?.name ||
      product.categories[0]?.category.translations[0]?.name ||
      null;

    return {
      id: product.id,
      name,
      image,
      variantCount: product._count.variantCombinations,
      minPrice,
      maxPrice,
      currency,
      brandName,
      categoryName,
    };
  });
};

const AdminProductsPage = async ({
  searchParams,
}: {
  searchParams: SearchParams;
}) => {
  const pageSearchParams = await searchParams;
  const search = (pageSearchParams.search as string) || null;
  const page = parseInt(pageSearchParams.page as string) || 1;
  const take = 10;

  // Paralel olarak hem ürünleri hem de toplam sayıyı al
  const [rawProducts, totalCount] = await Promise.all([
    feedProducts(search, page, take),
    getProductsCount(search),
  ]);

  const processedProducts = processProducts(rawProducts);

  const totalPages = Math.ceil(totalCount / take);

  return (
    <div className="flex flex-col gap-3">
      <ProductHeader />
      <ProductTable products={processedProducts} />

      {totalPages > 1 && (
        <CustomPagination total={totalPages} paramKey="page" />
      )}
    </div>
  );
};

export default AdminProductsPage;
