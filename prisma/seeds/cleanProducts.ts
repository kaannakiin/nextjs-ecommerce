import prisma from "@/lib/prisma";

async function main() {
  console.log("Kapsamlı temizlik işlemi başlıyor...");
  console.log(
    "Sırasıyla ürünler, variantlar ve ilişkili tüm veriler silinecek. Kategori ve Marka verilerine dokunulmayacak."
  );

  // --- 1. Ürünlere Bağlı Tüm İlişkileri ve Kombinasyonları Temizle ---
  // Bu adım, 'onDelete: Cascade' sayesinde aslında Product silindiğinde otomatik yapılır,
  // ancak sıralamanın net olması ve hataları önlemek için açıkça yapmak daha güvenlidir.

  console.log("Adım 1/5: Ürün varyant kombinasyon ilişkileri siliniyor...");
  await prisma.productVariantCombinationOption.deleteMany({});

  console.log("Adım 1/5: Ürün varyant grup seçenekleri siliniyor...");
  await prisma.productVariantGroupOption.deleteMany({});

  console.log("Adım 1/5: Ürün varyant kombinasyonları siliniyor...");
  // Cascade silme, kombinasyona bağlı fiyat, çeviri, resim gibi her şeyi temizler.
  await prisma.productVariantCombination.deleteMany({});

  console.log("Adım 1/5: Ürün varyant grupları siliniyor...");
  await prisma.productVariantGroup.deleteMany({});

  console.log("Adım 1/5: Ürün kategori ilişkileri siliniyor...");
  await prisma.productCategory.deleteMany({});

  console.log("Adım 1/5: Ürün asset ilişkileri siliniyor...");
  await prisma.productAsset.deleteMany({});

  console.log("Adım 1/5: Ürün fiyatları ve çevirileri siliniyor...");
  await prisma.productPrices.deleteMany({});
  await prisma.productTranslation.deleteMany({});

  // --- 2. Tüm Ürünleri Sil ---
  console.log("Adım 2/5: Tüm ürünler siliniyor...");
  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`-> ${deletedProducts.count} adet ürün başarıyla silindi.`);

  // --- 3. Artık Hiçbir Ürüne Bağlı Olmayan Variant ve Option'ları Sil ---
  // Ürünler silindiği için artık hiçbir Variant veya VariantOption bir ürüne bağlı değil.
  // Bu yüzden hepsini güvenle silebiliriz.
  console.log(
    "Adım 3/5: Varyant seçenekleri (VariantOption) ve çevirileri siliniyor..."
  );
  await prisma.variantOptionTranslation.deleteMany({});
  await prisma.variantOption.deleteMany({});

  console.log("Adım 4/5: Ana varyantlar (Variant) ve çevirileri siliniyor...");
  await prisma.variantTranslation.deleteMany({});
  await prisma.variant.deleteMany({});
  console.log("-> Tüm variant tanımları başarıyla silindi.");

  // --- 4. Korunanlar Dışındaki Tüm Asset'leri Sil ---
  // Sadece Kategori ve Markalar tarafından kullanılan Asset'leri koruyacağız.
  console.log(
    "Adım 5/5: Kategori ve markalara bağlı olmayan asset'ler siliniyor..."
  );

  // Kategori tarafından kullanılan asset ID'lerini topla
  const categoryAssets = await prisma.category.findMany({
    where: { imageId: { not: null } },
    select: { imageId: true },
  });

  // Marka tarafından kullanılan asset ID'lerini topla
  const brandAssets = await prisma.productBrand.findMany({
    where: { imageId: { not: null } },
    select: { imageId: true },
  });

  const protectedAssetIds = [
    ...categoryAssets.map((a) => a.imageId),
    ...brandAssets.map((a) => a.imageId),
  ].filter((id): id is string => id !== null); // null değerleri filtrele

  console.log(
    `-> ${protectedAssetIds.length} adet asset (kategori ve markalara ait) korunacak.`
  );

  // Korunan ID'ler dışındaki tüm asset'leri sil
  const deletedAssets = await prisma.asset.deleteMany({
    where: {
      id: {
        notIn: protectedAssetIds,
      },
    },
  });
  console.log(
    `-> ${deletedAssets.count} adet ürünlere ve diğer alanlara ait asset başarıyla silindi.`
  );

  console.log("\nTemizlik işlemi başarıyla tamamlandı!");
}

main()
  .catch((e) => {
    console.error("Seed işlemi sırasında bir hata oluştu:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma Client bağlantısı sonlandırıldı.");
  });
