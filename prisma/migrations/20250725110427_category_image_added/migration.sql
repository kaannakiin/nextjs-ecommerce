-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageId" TEXT;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
