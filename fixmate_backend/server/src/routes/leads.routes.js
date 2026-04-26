// routes/leads.routes.js
import express from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma.js";
import { LeadCreateSchema } from "../validators/leads.validator.js";
import { sendOwnerLeadEmail, sendCustomerConfirmationEmail } from "../email.js";

export const leadsRouter = express.Router();

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

leadsRouter.post("/", leadLimiter, async (req, res) => {
  const parsed = LeadCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  const data = parsed.data;

  try {
    // Prefer estimatedPrice, fallback to old estimateLow/high if provided
    const estimatedPrice =
      data.estimatedPrice ??
      data.estimateLow ??
      data.estimateHigh ??
      null;

    const lead = await prisma.lead.create({
      data: {
        type: data.type,
        fullName: data.fullName || null,
        email: data.email || null,
        phone: data.phone,
        brand: data.brand || null,
        model: data.model,
        issue: data.issue,
        message: data.message || null,
        preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
        preferredTime: data.preferredTime || null,

        // ✅ matches your schema.prisma
        estimatedPrice,
      },
    });

    // Fire-and-forget emails (good)
    sendOwnerLeadEmail({ lead }).catch((err) => console.error("Owner email failed:", err));
    sendCustomerConfirmationEmail({ lead }).catch((err) => console.error("Customer email failed:", err));

    return res.status(201).json({ leadId: lead.id });
  } catch (error) {
    console.error("Create lead error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
