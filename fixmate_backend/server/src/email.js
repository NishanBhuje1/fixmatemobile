import { Resend } from "resend";
import { bookingTimeLabel } from "./booking/time.js";

let client = null;
function resend() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

const STORE = {
  address: "Eastland Shopping Centre, 175 Maroondah Hwy, Ringwood VIC 3134",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Eastland+Shopping+Centre+175+Maroondah+Hwy+Ringwood+VIC+3134",
  phone: "(03) 8820 8183",
  phoneHref: "tel:+61388208183",
};

// estimatedPrice is in cents; null on a booking means the repair has no fixed price
function fmtEstimate(lead) {
  if (lead.estimatedPrice != null && lead.estimatedPrice > 0) {
    return `$${(lead.estimatedPrice / 100).toFixed(2)} (indicative, subject to inspection)`;
  }
  return lead.type === "Quote Booking" ? "To be quoted" : "-";
}

// New slot bookings: "Fri 9 Oct, 2:30 pm". Legacy bookings: "Fri 9 Oct, Morning".
function fmtBookingTime(lead) {
  return bookingTimeLabel(lead) || "-";
}

// "Apple iPhone" + "iPhone 17 Pro" -> "Apple iPhone 17 Pro"; "Samsung" + "Galaxy S24" -> "Samsung Galaxy S24"
function deviceLabel(lead) {
  const brand = String(lead.brand || "").trim();
  const model = String(lead.model || "").trim() || "-";
  if (!brand) return model;
  const brandWords = brand.split(/\s+/);
  const last = brandWords[brandWords.length - 1];
  if (model.toLowerCase().startsWith(last.toLowerCase())) {
    return [...brandWords.slice(0, -1), model].join(" ");
  }
  return `${brand} ${model}`;
}

function isApple(lead) {
  return String(lead.brand || "").toLowerCase().startsWith("apple");
}

function safe(v) {
  return String(v ?? "")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function sendOwnerLeadEmail({ lead }) {
  const when = lead.slotStart ? ` – ${fmtBookingTime(lead)}` : "";
  const subject = `[FixMate] New Lead: ${lead.type} - ${lead.model} (${lead.issue})${when}`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>New Lead Received</h2>

      <p><strong>Reference:</strong> ${safe(lead.reference || "-")}</p>
      <p><strong>Booking time:</strong> ${safe(fmtBookingTime(lead))}</p>

      <p><strong>Type:</strong> ${safe(lead.type)}</p>
      <p><strong>Name:</strong> ${safe(lead.fullName)}</p>
      <p><strong>Email:</strong> ${safe(lead.email || "-")}</p>
      <p><strong>Phone:</strong> ${safe(lead.phone)}</p>

      <p><strong>Device:</strong> ${safe(
        deviceLabel(lead)
      )}</p>
      <p><strong>Issue:</strong> ${safe(lead.issue)}</p>

      <p><strong>Estimate:</strong> ${safe(fmtEstimate(lead))}</p>

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
  const isBooking = Boolean(lead.slotStart);
  const subject = isBooking
    ? `Booking received ${lead.reference} – ${fmtBookingTime(lead)} – FixMate Mobile`
    : `We received your request – FixMate Mobile`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Thanks, ${safe(lead.fullName)}!</h2>
      <p>${
        isBooking
          ? "We’ve received your booking. We’ll contact you to confirm it."
          : "We’ve received your repair request and will contact you shortly."
      }</p>

      <div style="border:1px solid #eee; padding:14px; border-radius:10px;">
        ${
          lead.reference
            ? `<p style="margin:0 0 8px;">Booking reference: <strong style="font-size:18px; letter-spacing:1px;">${safe(
                lead.reference
              )}</strong></p>`
            : ""
        }
        <p style="margin:0 0 8px;"><strong>Your request</strong></p>
        ${
          lead.slotStart || lead.preferredDate || lead.preferredTime
            ? `<p style="margin:0;"><strong>Time:</strong> ${safe(fmtBookingTime(lead))}</p>`
            : ""
        }
        <p style="margin:0;"><strong>Device:</strong> ${safe(
          deviceLabel(lead)
        )}</p>
        <p style="margin:0;"><strong>Issue:</strong> ${safe(lead.issue)}</p>
        <p style="margin:0;"><strong>Estimate:</strong> ${safe(
          fmtEstimate(lead)
        )}</p>
      </div>

      ${
        isBooking
          ? `<p style="margin-top:16px;"><strong>Please bring</strong></p>
      <ul style="margin-top:0;">
        <li>Your device</li>
        <li>Your passcode, so we can test the device after the repair</li>
        ${isApple(lead) ? "<li>Find My turned off (Settings → your name → Find My), if you can</li>" : ""}
      </ul>
      <p style="margin:0;"><strong>FixMate Mobile</strong><br/>
        <a href="${STORE.mapsUrl}">${safe(STORE.address)}</a><br/>
        <a href="${STORE.phoneHref}">${safe(STORE.phone)}</a>
      </p>`
          : ""
      }

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
          deviceLabel(lead)
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
