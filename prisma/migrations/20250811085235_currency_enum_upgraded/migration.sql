-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."Currency" ADD VALUE 'AUD';
ALTER TYPE "public"."Currency" ADD VALUE 'DKK';
ALTER TYPE "public"."Currency" ADD VALUE 'GBP';
ALTER TYPE "public"."Currency" ADD VALUE 'CHF';
ALTER TYPE "public"."Currency" ADD VALUE 'SEK';
ALTER TYPE "public"."Currency" ADD VALUE 'CAD';
ALTER TYPE "public"."Currency" ADD VALUE 'KWD';
ALTER TYPE "public"."Currency" ADD VALUE 'NOK';
ALTER TYPE "public"."Currency" ADD VALUE 'SAR';
ALTER TYPE "public"."Currency" ADD VALUE 'JPY';
