-- CreateTable
CREATE TABLE "TaxonomyCategory" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "parentId" TEXT,
    "path" TEXT,
    "pathNames" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "originalName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyCategory_googleId_key" ON "TaxonomyCategory"("googleId");

-- CreateIndex
CREATE INDEX "TaxonomyCategory_googleId_idx" ON "TaxonomyCategory"("googleId");

-- CreateIndex
CREATE INDEX "TaxonomyCategory_parentId_idx" ON "TaxonomyCategory"("parentId");

-- CreateIndex
CREATE INDEX "TaxonomyCategory_path_idx" ON "TaxonomyCategory"("path");

-- CreateIndex
CREATE INDEX "TaxonomyCategory_depth_idx" ON "TaxonomyCategory"("depth");

-- CreateIndex
CREATE INDEX "TaxonomyCategory_isActive_idx" ON "TaxonomyCategory"("isActive");

-- AddForeignKey
ALTER TABLE "TaxonomyCategory" ADD CONSTRAINT "TaxonomyCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaxonomyCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
