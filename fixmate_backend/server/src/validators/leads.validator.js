import { z } from "zod";

export const LeadCreateSchema = z.object({
  type: z.string().min(1),
  fullName: z.string().optional().default(""),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(3),
  brand: z.string().optional().nullable(),
  model: z.string().min(1),
  issue: z.string().min(1),
  message: z.string().optional().nullable(),
  preferredDate: z.string().optional().nullable(), // ISO string from frontend, or null
  preferredTime: z.string().optional().nullable(),
  slotStart: z.string().optional().nullable(), // ISO start of a 30-min slot from /api/booking/availability

  // NEW (preferred)
  estimatedPrice: z.number().int().nonnegative().optional().nullable(),

  // OLD (optional for backwards compatibility)
  estimateLow: z.number().optional().nullable(),
  estimateHigh: z.number().optional().nullable(),
});
