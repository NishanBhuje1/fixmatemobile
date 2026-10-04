// routes/leads.routes.js
import express from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../prisma.js";
import { LeadCreateSchema } from "../validators/leads.validator.js";
import { sendOwnerLeadEmail, sendCustomerConfirmationEmail } from "../email.js";
import { ACTIVE_BOOKING, resolveBookableSlot } from "../booking/slots.js";
import { SLOT_CAPACITY, bookingTimeLabel, formatSlotTime, storeDateOf } from "../booking/time.js";
import { newBookingReference } from "../booking/reference.js";

export const leadsRouter = express.Router();

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

class SlotFullError extends Error {}

function isReferenceCollision(e) {
  return e?.code === "P2002" && String(e?.meta?.target || "").includes("reference");
}

// What the browser gets back: enough for the confirmation page, nothing it didn't send
function publicBooking(lead) {
  return {
    reference: lead.reference,
    type: lead.type,
    fullName: lead.fullName,
    brand: lead.brand,
    model: lead.model,
    issue: lead.issue,
    estimatedPrice: lead.estimatedPrice, // cents, null = to be quoted
    slotStart: lead.slotStart ? lead.slotStart.toISOString() : null,
    slotLabel: bookingTimeLabel(lead) || null, // "Fri 9 Oct, 2:30 pm"
    createdAt: lead.createdAt.toISOString(),
  };
}

/**
 * Creates the lead. For a slot booking, the capacity check and insert happen in one transaction
 * holding a per-slot advisory lock, so two requests for the last place are serialised and only
 * one succeeds. Retries on the (very unlikely) booking reference collision.
 */
async function createLead(data, slotStart) {
  for (let attempt = 1; ; attempt++) {
    const reference = newBookingReference();
    try {
      return await prisma.$transaction(async (tx) => {
        if (slotStart) {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"slot:" + slotStart.toISOString()}))::text`;
          const taken = await tx.lead.count({ where: { ...ACTIVE_BOOKING, slotStart } });
          if (taken >= SLOT_CAPACITY) throw new SlotFullError();
        }
        return tx.lead.create({ data: { ...data, reference } });
      });
    } catch (e) {
      if (isReferenceCollision(e) && attempt < 5) continue;
      throw e;
    }
  }
}

leadsRouter.post("/", leadLimiter, async (req, res) => {
  const parsed = LeadCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid payload",
      details: parsed.error.flatten(),
    });
  }

  const data = parsed.data;

  // New bookings send an exact slot. Requests without one (custom quotes, or an older cached
  // version of the site sending Morning/Afternoon) are stored the legacy way.
  let slotStart = null;
  if (data.slotStart) {
    slotStart = await resolveBookableSlot(data.slotStart);
    if (!slotStart) {
      return res.status(400).json({
        error: "That time is no longer available. Please choose another time.",
        code: "SLOT_INVALID",
      });
    }
  }

  try {
    const estimatedPrice =
      data.estimatedPrice ??
      data.estimateLow ??
      data.estimateHigh ??
      null;

    const lead = await createLead(
      {
        type: data.type,
        fullName: data.fullName || null,
        email: data.email || null,
        phone: data.phone,
        brand: data.brand || null,
        model: data.model,
        issue: data.issue,
        message: data.message || null,
        // Slot bookings also fill the legacy columns (day at midnight UTC + readable time)
        preferredDate: slotStart
          ? new Date(`${storeDateOf(slotStart)}T00:00:00.000Z`)
          : data.preferredDate
          ? new Date(data.preferredDate)
          : null,
        preferredTime: slotStart ? formatSlotTime(slotStart) : data.preferredTime || null,
        slotStart,

        // ✅ matches your schema.prisma
        estimatedPrice,
      },
      slotStart
    );

    // Fire-and-forget emails (good)
    sendOwnerLeadEmail({ lead }).catch((err) => console.error("Owner email failed:", err));
    sendCustomerConfirmationEmail({ lead }).catch((err) => console.error("Customer email failed:", err));

    return res.status(201).json({ leadId: lead.id, reference: lead.reference, booking: publicBooking(lead) });
  } catch (error) {
    if (error instanceof SlotFullError) {
      return res.status(409).json({
        error: "Sorry, that time was just booked. Please choose another time.",
        code: "SLOT_FULL",
      });
    }
    console.error("Create lead error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
