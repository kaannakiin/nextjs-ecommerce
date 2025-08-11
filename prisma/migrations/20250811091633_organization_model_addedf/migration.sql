-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "mainCurrency" "public"."Currency" NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
