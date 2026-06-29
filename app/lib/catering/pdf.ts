import jsPDF from "jspdf";
import { formatCents } from "@/app/lib/money";
import { ADDRESS, PHONE_DISPLAY } from "@/app/components/ContactBar";
import type { CateringOrderRecord } from "./types";

const MAROON: [number, number, number] = [123, 37, 37]; // #7b2525
const COPPER: [number, number, number] = [186, 106, 76]; // #ba6a4c
const INK: [number, number, number] = [45, 36, 36]; // #2d2424
const GRAY: [number, number, number] = [128, 128, 128];

function formatEventDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildCateringOrderPdf(order: CateringOrderRecord): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const isQuote = order.isQuote;

  // Header band
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setFontSize(20);
  doc.setTextColor(250, 250, 250);
  doc.setFont("helvetica", "bold");
  doc.text("MABE'S SANDWICH SHOP", margin, 15);
  doc.setFontSize(10);
  doc.setTextColor(...COPPER);
  doc.text(`${isQuote ? "Quote" : "Order"} #${order.orderNumber}`, margin, 25);
  doc.setTextColor(200, 200, 200);
  doc.text(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    pageWidth - margin,
    25,
    { align: "right" }
  );

  let y = 45;
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.text(isQuote ? "CATERING QUOTE" : "CATERING ORDER RECEIPT", margin, y);
  y += 12;

  // Items header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 5, contentWidth, 8, "F");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("ITEM", margin + 2, y);
  doc.text("QTY", margin + 110, y);
  doc.text("AMOUNT", pageWidth - margin - 2, y, { align: "right" });
  y += 8;

  doc.setFont("helvetica", "normal");
  order.items.forEach((item) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(item.name, margin + 2, y);
    const mods = item.selectedModifiers
      .filter((m) => !(m.priceCents === 0 && /^no\b/i.test(m.name)))
      .map((m) => m.name)
      .join(", ");
    if (mods) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(mods, margin + 2, y + 4);
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    doc.text(String(item.quantity), margin + 110, y);
    doc.text(formatCents(item.lineTotalCents), pageWidth - margin - 2, y, { align: "right" });
    y += mods ? 12 : 8;
  });

  y += 2;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Totals
  const totalLine = (label: string, cents: number) => {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(label, margin + 2, y);
    doc.setTextColor(...INK);
    doc.text(formatCents(cents), pageWidth - margin - 2, y, { align: "right" });
    y += 7;
  };
  totalLine("Subtotal", order.subtotalCents);
  totalLine("Delivery", order.deliveryFeeCents);
  totalLine(order.taxExempt ? "Tax (exempt)" : "Tax", order.taxCents);

  doc.setDrawColor(220, 220, 220);
  doc.line(margin + 100, y - 3, pageWidth - margin, y - 3);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...INK);
  doc.text("Total", margin + 2, y + 4);
  doc.setTextColor(...MAROON);
  doc.text(formatCents(order.totalCents), pageWidth - margin - 2, y + 4, { align: "right" });
  y += 16;

  // Details band
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(...INK);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(10);
  doc.setTextColor(250, 250, 250);
  doc.setFont("helvetica", "bold");
  doc.text("ORDER DETAILS", margin + 4, y + 6);
  y += 16;

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("CONTACT", margin + 2, y);
  doc.text(order.fulfillmentType === "delivery" ? "DELIVERY ADDRESS" : "PICKUP", pageWidth / 2 + 5, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(order.customerName, margin + 2, y);
  doc.text(
    order.fulfillmentType === "delivery" ? order.deliveryAddress || "—" : ADDRESS,
    pageWidth / 2 + 5,
    y,
    { maxWidth: contentWidth / 2 - 5 }
  );
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(order.customerEmail, margin + 2, y);
  y += 5;
  if (order.customerPhone) {
    doc.text(order.customerPhone, margin + 2, y);
    y += 5;
  }
  if (order.company) {
    doc.text(order.company, margin + 2, y);
    y += 5;
  }
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("DATE & TIME", margin + 2, y);
  doc.text("GUESTS", pageWidth / 2 + 5, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text(formatEventDate(order.eventDate), margin + 2, y);
  doc.text(order.headcount ? `${order.headcount}` : "—", pageWidth / 2 + 5, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(order.eventTime || "", margin + 2, y);
  y += 12;

  if (order.specialInstructions) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", margin + 2, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(order.specialInstructions, margin + 2, y, { maxWidth: contentWidth });
    y += 12;
  }

  // Footer
  doc.setDrawColor(...COPPER);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text(`Mabe's Sandwich Shop  |  ${PHONE_DISPLAY}  |  ${ADDRESS}`, pageWidth / 2, y, {
    align: "center",
  });
  y += 5;
  doc.text("Thank you for choosing Mabe's!", pageWidth / 2, y, { align: "center" });

  const buf = doc.output("arraybuffer");
  return new Uint8Array(buf);
}

// Browser convenience: trigger a file download from the bytes.
export function downloadCateringOrderPdf(order: CateringOrderRecord): void {
  const bytes = buildCateringOrderPdf(order);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Mabes-${order.isQuote ? "Quote" : "Order"}-${order.orderNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
