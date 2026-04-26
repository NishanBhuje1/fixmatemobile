import { Resend } from "resend";

let client = null;
function resend() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function fmtEstimate(lead) {
  if (lead.estimateLow != null && lead.estimateHigh != null) {
    return `$${lead.estimateLow} – $${lead.estimateHigh}`;
  }
  return "-";
}

function safe(v) {
  return String(v ?? "")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function sendOwnerLeadEmail({ lead }) {
  const subject = `[FixMate] New Lead: ${lead.type} - ${lead.model} (${lead.issue})`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>New Lead Received</h2>

      <p><strong>Type:</strong> ${safe(lead.type)}</p>
      <p><strong>Name:</strong> ${safe(lead.fullName)}</p>
      <p><strong>Email:</strong> ${safe(lead.email || "-")}</p>
      <p><strong>Phone:</strong> ${safe(lead.phone)}</p>

      <p><strong>Device:</strong> ${safe(
        (lead.brand ? lead.brand + " " : "") + (lead.model || "-")
      )}</p>
      <p><strong>Issue:</strong> ${safe(lead.issue)}</p>

      <p><strong>Estimate:</strong> ${safe(fmtEstimate(lead))}</p>
      <p><strong>Preferred Date:</strong> ${
        lead.preferredDate
          ? new Date(lead.preferredDate).toLocaleDateString()
          : "-"
      }</p>
      <p><strong>Preferred Time:</strong> ${safe(lead.preferredTime || "-")}</p>

      <p><strong>Message:</strong><br/>${safe(lead.message || "-").replaceAll(
        "\n",
        "<br/>"
      )}</p>

      <hr/>
      <p style="color:#666;">Lead ID: ${safe(lead.id)}</p>
    </div>
  `;

  await resend().emails.send({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject,
    html,
  });
}

export async function sendCustomerConfirmationEmail({ lead }) {
  if (!lead.email) return;

  const siteUrl = process.env.PUBLIC_SITE_URL || "";
  const subject = `We received your request – FixMate Mobile`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Thanks, ${safe(lead.fullName)}!</h2>
      <p>We’ve received your repair request and will contact you shortly.</p>

      <div style="border:1px solid #eee; padding:14px; border-radius:10px;">
        <p style="margin:0 0 8px;"><strong>Your request</strong></p>
        <p style="margin:0;"><strong>Device:</strong> ${safe(
          (lead.brand ? lead.brand + " " : "") + (lead.model || "-")
        )}</p>
        <p style="margin:0;"><strong>Issue:</strong> ${safe(lead.issue)}</p>
        <p style="margin:0;"><strong>Estimate:</strong> ${safe(
          fmtEstimate(lead)
        )}</p>
        ${
          lead.preferredDate || lead.preferredTime
            ? `<p style="margin:0;"><strong>Preferred time:</strong> ${
                lead.preferredDate
                  ? new Date(lead.preferredDate).toLocaleDateString()
                  : "-"
              } ${safe(lead.preferredTime || "")}</p>`
            : ""
        }
      </div>

      <p style="margin-top:16px;">
        If you need to add more details, reply to this email or call us.
      </p>

      ${siteUrl ? `<p><a href="${siteUrl}">Visit our website</a></p>` : ""}

      <p style="color:#666; font-size: 12px; margin-top: 18px;">
        This is an automated confirmation.
      </p>
    </div>
  `;

  await resend().emails.send({
    from: process.env.EMAIL_FROM,
    to: lead.email,
    subject,
    html,
  });
}

export async function sendFinalQuoteEmail({ lead, finalQuote, quoteNotes }) {
  if (!lead?.email) return;

  const subject = `Your FixMate Quote: $${finalQuote}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Your Repair Quote</h2>
      <p>Hi ${safe(lead.fullName)},</p>

      <p>Here is your final quote based on your request:</p>

      <div style="border:1px solid #eee; padding:14px; border-radius:10px;">
        <p style="margin:0;"><strong>Device:</strong> ${safe(
          (lead.brand ? lead.brand + " " : "") + (lead.model || "-")
        )}</p>
        <p style="margin:0;"><strong>Issue:</strong> ${safe(lead.issue)}</p>
        <p style="margin:0;"><strong>Final Quote:</strong> <strong>$${safe(
          finalQuote
        )}</strong></p>
        ${
          quoteNotes
            ? `<p style="margin:10px 0 0;"><strong>Notes:</strong><br/>${safe(
                quoteNotes
              ).replaceAll("\n", "<br/>")}</p>`
            : ""
        }
      </div>

      <p style="margin-top:16px;">
        Reply to this email to confirm, or call us to book your appointment.
      </p>

      <p style="color:#666; font-size: 12px; margin-top: 18px;">
        FixMate Mobile
      </p>
    </div>
  `;

  await resend().emails.send({
    from: process.env.EMAIL_FROM,
    to: lead.email,
    subject,
    html,
    reply_to: process.env.EMAIL_TO, // replies go to your business inbox
  });
}
