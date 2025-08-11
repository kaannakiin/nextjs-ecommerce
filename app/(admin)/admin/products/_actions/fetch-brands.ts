"use server";

import prisma from "@/lib/prisma";

// Sadece ihtiyacın olan basit tip
export interface SimpleBrand {
  id: string;
  name: string;
  level: number;
}

export interface FetchBrandResponse {
  success: boolean;
  data: SimpleBrand[];
  error?: string;
}

export async function fetchBrand(): Promise<FetchBrandResponse> {
  try {
    // Raw query ile brand hierarchy + TR translations birleştir
    const brands = (await prisma.$queryRaw`
      WITH RECURSIVE brand_hierarchy AS (
        -- Ana markalar
        SELECT 
          pb.id, 
          pb."parentBrandId",
          0 as level,
          ARRAY[pb.id] as path
        FROM "ProductBrand" pb
        WHERE pb."parentBrandId" IS NULL
        
        UNION ALL
        
        -- Alt markalar
        SELECT 
          pb.id,
          pb."parentBrandId",
          bh.level + 1,
          bh.path || pb.id
        FROM "ProductBrand" pb
        INNER JOIN brand_hierarchy bh ON pb."parentBrandId" = bh.id
        WHERE NOT pb.id = ANY(bh.path)
      )
      SELECT 
        bh.id,
        bh.level,
        COALESCE(pbt.name, 'İsimsiz Marka') as name
      FROM brand_hierarchy bh
      LEFT JOIN "ProductBrandTranslation" pbt ON bh.id = pbt."brandId" AND pbt.locale = 'TR'
      ORDER BY bh.level, bh.id
    `) as SimpleBrand[];

    return {
      success: true,
      data: brands,
    };
  } catch (error) {
    console.error("Brands fetch error:", error);

    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
