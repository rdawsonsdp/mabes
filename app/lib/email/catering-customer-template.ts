import { formatCents } from "@/app/lib/money";
import { CATERING_EMAIL, ADDRESS, PHONE_DISPLAY } from "@/app/components/ContactBar";
import { sendEmail } from "./send-email";
import type { CateringOrderRecord } from "@/app/lib/catering/types";

const MAROON = "#7b2525";
const COPPER = "#ba6a4c";
const INK = "#2d2424";
const CREAM = "#eee0cc";

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

function modLine(mods: { name: string; priceCents: number }[]): string {
  const meaningful = mods.filter((m) => !(m.priceCents === 0 && /^no\b/i.test(m.name)));
  if (meaningful.length === 0) return "";
  return meaningful
    .map((m) => escapeHtml(m.name) + (m.priceCents > 0 ? ` (+${formatCents(m.priceCents)})` : ""))
    .join(", ");
}

export function buildCateringCustomerHtml(order: CateringOrderRecord): string {
  const isQuote = order.isQuote;
  const title = isQuote ? "Your Catering Quote" : "Your Catering Order";
  const prefix = isQuote ? "Quote" : "Order";
  const firstName = order.customerName.split(" ")[0] || "there";

  const intro = isQuote
    ? "Thank you for your interest in Mabe's catering! Here are the details of your quote. We'll review it and be in touch within 1 business day."
    : "Thank you for your order! Payment received. Here is your order confirmation.";

  const fulfillmentLabel =
    order.fulfillmentType === "delivery"
      ? `Delivery to ${escapeHtml(order.deliveryAddress || "—")}`
      : `Pickup at ${escapeHtml(ADDRESS)}`;

  const itemRows = order.items
    .map((item) => {
      const mods = modLine(item.selectedModifiers);
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};">
          <strong>${escapeHtml(item.name)}</strong> &times; ${item.quantity}<br/>
          ${mods ? `<span style="color:#888;font-size:12px;">${mods}</span><br/>` : ""}
          ${item.notes ? `<span style="color:#888;font-size:12px;font-style:italic;">${escapeHtml(item.notes)}</span>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};text-align:right;white-space:nowrap;vertical-align:top;">
          ${formatCents(item.lineTotalCents)}
        </td>
      </tr>`;
    })
    .join("");

  const nextSteps = isQuote
    ? `<ol style="margin:0;padding-left:20px;color:#555;font-size:14px;line-height:1.8;">
         <li>Our team reviews your quote within 1 business day</li>
         <li>We'll confirm details and answer any questions</li>
         <li>Once approved, we lock in your event date</li>
       </ol>`
    : `<ol style="margin:0;padding-left:20px;color:#555;font-size:14px;line-height:1.8;">
         <li>Your payment has been received — your order is confirmed</li>
         <li>We'll reach out to finalize event details</li>
         <li>Your order will be ready for your selected ${order.fulfillmentType}</li>
       </ol>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:${CREAM};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};padding:20px 0;"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr><td style="background-color:${MAROON};padding:32px 24px;text-align:center;">
        <h1 style="margin:0;font-size:26px;font-weight:700;color:${CREAM};letter-spacing:2px;">MABE'S SANDWICH SHOP</h1>
        <p style="margin:8px 0 0;font-size:13px;color:${COPPER};letter-spacing:1px;">CATERING</p>
      </td></tr>
      <tr><td style="background-color:${COPPER};padding:16px 24px;text-align:center;">
        <h2 style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:1px;">${title.toUpperCase()}</h2>
        <p style="margin:4px 0 0;font-size:14px;color:#fff;">${prefix} #${escapeHtml(order.orderNumber)}</p>
      </td></tr>
      <tr><td style="padding:24px 24px 8px;">
        <p style="margin:0;font-size:16px;color:${INK};">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:8px 0 0;font-size:14px;color:#555;line-height:1.6;">${intro}</p>
      </td></tr>
      <tr><td style="padding:8px 24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border-radius:8px;border:1px solid #eee;">
          <tr><td style="padding:16px;">
            <h3 style="margin:0 0 12px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">Event Details</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:4px 0;font-size:14px;color:#888;width:110px;">Date</td><td style="padding:4px 0;font-size:14px;color:${INK};font-weight:600;">${formatEventDate(order.eventDate)}</td></tr>
              <tr><td style="padding:4px 0;font-size:14px;color:#888;">Time</td><td style="padding:4px 0;font-size:14px;color:${INK};font-weight:600;">${escapeHtml(order.eventTime || "TBD")}</td></tr>
              ${order.headcount ? `<tr><td style="padding:4px 0;font-size:14px;color:#888;">Guests</td><td style="padding:4px 0;font-size:14px;color:${INK};font-weight:600;">${order.headcount}</td></tr>` : ""}
              <tr><td style="padding:4px 0;font-size:14px;color:#888;">Fulfillment</td><td style="padding:4px 0;font-size:14px;color:${INK};">${fulfillmentLabel}</td></tr>
              ${order.specialInstructions ? `<tr><td style="padding:4px 0;font-size:14px;color:#888;vertical-align:top;">Notes</td><td style="padding:4px 0;font-size:14px;color:${INK};font-style:italic;">${escapeHtml(order.specialInstructions)}</td></tr>` : ""}
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 24px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${MAROON};">Item</td>
              <td style="padding:8px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${MAROON};text-align:right;">Price</td></tr>
          ${itemRows}
        </table>
      </td></tr>
      <tr><td style="padding:0 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;font-size:14px;color:#555;">Subtotal</td><td style="padding:6px 0;font-size:14px;color:${INK};text-align:right;">${formatCents(order.subtotalCents)}</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#555;">Delivery</td><td style="padding:6px 0;font-size:14px;color:${INK};text-align:right;">${formatCents(order.deliveryFeeCents)}</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#555;">Tax${order.taxExempt ? " (exempt)" : ""}</td><td style="padding:6px 0;font-size:14px;color:${INK};text-align:right;">${formatCents(order.taxCents)}</td></tr>
          <tr><td style="padding:12px 0 6px;font-size:18px;font-weight:700;color:${INK};border-top:2px solid ${MAROON};">Total</td><td style="padding:12px 0 6px;font-size:18px;font-weight:700;color:${MAROON};border-top:2px solid ${MAROON};text-align:right;">${formatCents(order.totalCents)}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:0 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};border-radius:8px;"><tr><td style="padding:20px;">
          <h3 style="margin:0 0 12px;font-size:16px;color:${INK};">What Happens Next</h3>
          ${nextSteps}
        </td></tr></table>
      </td></tr>
      <tr><td style="background-color:${MAROON};padding:24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:14px;color:${CREAM};font-weight:700;letter-spacing:1px;">MABE'S SANDWICH SHOP</p>
        <p style="margin:0 0 4px;font-size:13px;color:#ddd;">${PHONE_DISPLAY} &bull; ${escapeHtml(CATERING_EMAIL)}</p>
        <p style="margin:0;font-size:13px;color:#ddd;">${escapeHtml(ADDRESS)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export async function sendCateringCustomerEmail(
  order: CateringOrderRecord
): Promise<{ success: boolean; id?: string }> {
  const html = buildCateringCustomerHtml(order);
  const subject = order.isQuote
    ? `Your Mabe's Catering Quote ${order.orderNumber}`
    : `Your Mabe's Catering Order ${order.orderNumber}`;
  return sendEmail({ to: order.customerEmail, subject, html, replyTo: CATERING_EMAIL });
}
