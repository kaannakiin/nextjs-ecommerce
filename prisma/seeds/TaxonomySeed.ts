import prisma from "@/lib/prisma";

interface TaxonomyItem {
  googleId: string;
  fullPath: string;
  pathParts: string[];
  depth: number;
  name: string;
  parentGoogleId?: string;
}

async function seedTaxonomy() {
  try {
    console.log("🚀 Starting Google Taxonomy import...");

    const response = await fetch(
      "https://www.google.com/basepages/producttype/taxonomy-with-ids.tr-TR.txt"
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textData = await response.text();
    console.log("✅ Taxonomy data fetched successfully");

    // 2. Veriyi parse et
    const taxonomyItems = parseTaxonomyData(textData);
    console.log(`📊 Parsed ${taxonomyItems.length} taxonomy items`);

    // 3. Kategorileri derinlik sırasına göre sırala (önce parent'lar sonra children)
    const sortedItems = taxonomyItems.sort((a, b) => a.depth - b.depth);

    // 4. Veritabanına kaydet
    await saveTaxonomiesToDB(sortedItems);

    console.log("🎉 Taxonomy import completed successfully!");
  } catch (error) {
    console.error("❌ Error importing taxonomy:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function parseTaxonomyData(textData: string): TaxonomyItem[] {
  const lines = textData.split("\n").filter((line) => line.trim());
  const taxonomyItems: TaxonomyItem[] = [];

  for (const line of lines) {
    // Format: "499864 - BÃ¼ro Malzemeleri > Ofis EkipmanlarÄ± > Hesap Makinesi AksesuarlarÄ±"
    const match = line.match(/^(\d+)\s*-\s*(.+)$/);
    if (!match) continue;

    const googleId = match[1];
    const fullPath = match[2].trim();

    // ">" ile ayır ve path parçalarını temizle
    const pathParts = fullPath.split(">").map((part) => part.trim());
    const depth = pathParts.length - 1;
    const name = pathParts[pathParts.length - 1]; // Son element kategori adı

    // Parent'ı bulmak için bir önceki depth'teki kategorileri ara
    let parentGoogleId: string | undefined;
    if (depth > 0) {
      const parentPath = pathParts.slice(0, -1).join(" > ");
      const parentItem = taxonomyItems.find(
        (item) => item.fullPath === parentPath && item.depth === depth - 1
      );
      parentGoogleId = parentItem?.googleId;
    }

    taxonomyItems.push({
      googleId,
      fullPath,
      pathParts,
      depth,
      name,
      parentGoogleId,
    });
  }

  return taxonomyItems;
}

async function saveTaxonomiesToDB(items: TaxonomyItem[]) {
  await prisma.taxonomyCategory.deleteMany();

  let saved = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      // Parent ID'sini bul
      let parentId: string | undefined;
      if (item.parentGoogleId) {
        const parent = await prisma.taxonomyCategory.findUnique({
          where: { googleId: item.parentGoogleId },
        });
        parentId = parent?.id;
      }

      // Path oluştur
      const pathIds: string[] = [];
      if (parentId) {
        const parent = await prisma.taxonomyCategory.findUnique({
          where: { id: parentId },
          select: { path: true },
        });
        if (parent?.path) {
          pathIds.push(...parent.path.split("/").filter(Boolean));
        }
      }
      pathIds.push(item.googleId);
      const path = "/" + pathIds.join("/");

      // Kategoriyi kaydet veya güncelle
      await prisma.taxonomyCategory.upsert({
        where: { googleId: item.googleId },
        update: {
          parentId,
          path,
          pathNames: item.fullPath,
          depth: item.depth,
          originalName: item.fullPath,
          isActive: true,
        },
        create: {
          googleId: item.googleId,
          parentId,
          path,
          pathNames: item.fullPath,
          depth: item.depth,
          originalName: item.fullPath,
          isActive: true,
        },
      });

      saved++;

      if (saved % 100 === 0) {
        console.log(`📈 Progress: ${saved}/${items.length} categories saved`);
      }
    } catch (error) {
      console.error(`❌ Error saving category ${item.googleId}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Database operations completed!`);
  console.log(`📊 Saved: ${saved}, Skipped: ${skipped}`);
}
seedTaxonomy().catch(console.error);
