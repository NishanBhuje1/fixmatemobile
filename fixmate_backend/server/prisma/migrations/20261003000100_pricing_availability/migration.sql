-- Allow repairs without a fixed price ("Get a quote") and repairs that are not offered ("Not available").
-- Existing rows keep their price and become available = true.
ALTER TABLE "Pricing" ALTER COLUMN "price" DROP NOT NULL;

ALTER TABLE "Pricing" ADD COLUMN "available" BOOLEAN NOT NULL DEFAULT true;
