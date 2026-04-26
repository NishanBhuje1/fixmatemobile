import { z } from "zod";

export const PricingUpsertSchema = z.object({
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(120),
  issue: z.string().min(1).max(120),
  // price is INT in DB. Best practice: store cents.
  // Example: $159.00 => 15900
  price: z.number().int().positive(),
});
