import express from "express";
import { prisma } from "../prisma.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendFinalQuoteEmail } from "../email.js";

export const quotesRouter = express.Router();
quotesRouter.use(requireAdmin);

quotesRouter.post("/send", async (req, res) => {
  const { leadId, finalQuote, quoteNotes } = req.body || {};

  if (!leadId || !Number.isFinite(Number(finalQuote))) {
    return res.status(400).json({ error: "leadId and finalQuote are required" });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (!lead.email) return res.status(400).json({ error: "Lead has no email" });

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      finalQuote: Number(finalQuote),
      quoteNotes: quoteNotes || null,
      status: "QUOTED",
      quotedAt: new Date(),
    },
  });

  sendFinalQuoteEmail({
    lead: updated,
    finalQuote: updated.finalQuote,
    quoteNotes: updated.quoteNotes,
  }).catch((e) => console.error("Final quote email failed:", e));

  res.json({ ok: true });
});
