import { formatCents } from "@/app/lib/money";
import { CATERING_EMAIL, ADDRESS } from "@/app/components/ContactBar";
import { sendEmail } from "./send-email";
import type { CateringOrderRecord } from "@/app/lib/catering/types";

const MAROON = "#7b2525";
const COPPER = "#ba6a4c";
const INK = "#2d2424";

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildCateringStaffHtml(order: CateringOrderRecord): string {
  const isQuote = order.isQuote;
  const banner = isQuote
    ? "New Catering Quote Request — Follow Up to Confirm"
    : "New PAID Catering Order — Prepare & Confirm";
  const phoneDigits = (order.customerPhone || "").replace(/[^0-9+]/g, "");
  const phoneTel = phoneDigits ? `tel:${phoneDigits}` : "#";
  const fulfillment =
    order.fulfillmentType === "delivery"
      ? `Delivery — ${escapeHtml(order.deliveryAddress || "— no address —")}`
      : `Pickup at ${escapeHtml(ADDRESS)}`;

  const itemRows = order.items
    .map((item) => {
      const mods = item.selectedModifiers
        .filter((m) => !(m.priceCents === 0 && /^no\b/i.test(m.name)))
        .map((m) => escapeHtml(m.name))
        .join(", ");
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f5f5f5;">
            <div style="font-size:14px;font-weight:600;color:${INK};">${escapeHtml(item.name)} &times; ${item.quantity}</div>
            ${mods ? `<div style="font-size:12px;color:#888;margin-top:2px;">${mods}</div>` : ""}
            ${item.notes ? `<div style="font-size:12px;color:#888;font-style:italic;">${escapeHtml(item.notes)}</div>` : ""}
          </td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:14px;font-weight:600;color:${INK};white-space:nowrap;">${formatCents(item.lineTotalCents)}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>New ${isQuote ? "Quote" : "Order"} #${escapeHtml(order.orderNumber)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <tr><td style="background:${COPPER};padding:20px 24px;color:#fff;">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.95;margin-bottom:6px;">${banner}</div>
        <div style="font-size:24px;font-weight:700;line-height:1.2;">${escapeHtml(order.customerName)}</div>
        <div style="margin-top:8px;"><a href="${phoneTel}" style="display:inline-block;background:${MAROON};color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:10px 18px;border-radius:8px;">${escapeHtml(order.customerPhone || "no phone")}</a></div>
        <div style="margin-top:12px;font-size:14px;opacity:0.95;">
          Total: <strong style="font-size:18px;">${formatCents(order.totalCents)}</strong>
          ${order.headcount ? `&nbsp;·&nbsp; ${order.headcount} guests` : ""}
          &nbsp;·&nbsp; Event: <strong>${formatEventDate(order.eventDate)}${order.eventTime ? " @ " + escapeHtml(order.eventTime) : ""}</strong>
        </div>
      </td></tr>
      <tr><td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;padding-bottom:6px;">${isQuote ? "Quote" : "Order"} #</td>
              <td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;padding-bottom:6px;">Email</td>
              ${order.company ? `<td style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;padding-bottom:6px;">Company</td>` : ""}</tr>
          <tr><td style="font-size:14px;font-weight:700;color:${INK};padding-right:16px;">${escapeHtml(order.orderNumber)}</td>
              <td style="font-size:14px;padding-right:16px;"><a href="mailto:${escapeHtml(order.customerEmail)}" style="color:${COPPER};text-decoration:none;">${escapeHtml(order.customerEmail)}</a></td>
              ${order.company ? `<td style="font-size:14px;color:${INK};">${escapeHtml(order.company)}</td>` : ""}</tr>
        </table>
      </td></tr>
      <tr><td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:6px;">Fulfillment</div>
        <div style="font-size:14px;color:${INK};line-height:1.5;">${fulfillment}
          ${order.specialInstructions ? `<div style="margin-top:8px;padding:10px 12px;background:#fffbe6;border-left:3px solid ${COPPER};font-size:13px;"><strong>Notes:</strong> ${escapeHtml(order.specialInstructions)}</div>` : ""}
          ${order.taxExempt ? `<div style="margin-top:8px;font-size:13px;color:${MAROON};"><strong>Tax exempt</strong>${order.taxExemptCertificateUrl ? ` — <a href="${escapeHtml(order.taxExemptCertificateUrl)}" style="color:${COPPER};">certificate</a>` : " — no certificate uploaded"}</div>` : ""}
        </div>
      </td></tr>
      <tr><td style="padding:20px 24px;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:10px;">Order Items</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
      </td></tr>
      <tr><td style="padding:20px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:13px;color:#666;padding:4px 0;">Subtotal</td><td align="right" style="font-size:13px;color:${INK};padding:4px 0;">${formatCents(order.subtotalCents)}</td></tr>
          <tr><td style="font-size:13px;color:#666;padding:4px 0;">Delivery</td><td align="right" style="font-size:13px;color:${INK};padding:4px 0;">${formatCents(order.deliveryFeeCents)}</td></tr>
          <tr><td style="font-size:13px;color:#666;padding:4px 0;">Tax</td><td align="right" style="font-size:13px;color:${INK};padding:4px 0;">${formatCents(order.taxCents)}</td></tr>
          <tr><td style="font-size:18px;font-weight:700;color:${INK};padding:10px 0 4px;border-top:2px solid ${MAROON};">Total</td><td align="right" style="font-size:20px;font-weight:700;color:${MAROON};padding:10px 0 4px;border-top:2px solid ${MAROON};">${formatCents(order.totalCents)}</td></tr>
        </table>
      </td></tr>
    </table>
    <div style="font-size:11px;color:#999;text-align:center;margin-top:16px;">Sent from the Mabe's catering site.</div>
  </td></tr></table>
</body></html>`;
}

export async function sendCateringStaffEmail(
  order: CateringOrderRecord
): Promise<{ success: boolean; id?: string }> {
  const html = buildCateringStaffHtml(order);
  const subject = `[Catering] ${order.isQuote ? "Quote" : "PAID Order"} ${order.orderNumber} — ${order.customerName}`;
  return sendEmail({
    to: CATERING_EMAIL,
    subject,
    html,
    replyTo: order.customerEmail,
  });
}
