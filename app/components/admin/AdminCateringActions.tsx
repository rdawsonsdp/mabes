"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CateringOrderRecord, CateringOrderStatus } from "@/app/lib/catering/types";
import { downloadCateringOrderPdf } from "@/app/lib/catering/pdf";

const STATUSES: { value: CateringOrderStatus; label: string }[] = [
  { value: "quote_requested", label: "Quote requested" },
  { value: "pending_payment", label: "Pending payment" },
  { value: "paid", label: "Paid" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];

export function AdminCateringActions({ order }: { order: CateringOrderRecord }) {
  const router = useRouter();
  const [status, setStatus] = useState<CateringOrderStatus>(order.status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const changeStatus = async (next: CateringOrderStatus) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/catering/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      setStatus(next);
      setMsg({ text: `Status changed to "${next.replace(/_/g, " ")}".`, ok: true });
      router.refresh();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "Update failed", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/catering/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Approve failed");
      setStatus("confirmed");
      setMsg({ text: "Order approved — confirmation email sent to the customer.", ok: true });
      router.refresh();
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "Approve failed", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const resend = async (recipient: "customer" | "staff" | "both") => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/catering/${order.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", recipient }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Send failed");
      setMsg({ text: `Confirmation re-sent (${recipient}).`, ok: true });
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "Send failed", ok: false });
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "font-display rounded-pill px-4 py-2 text-small tracking-wide transition-colors disabled:opacity-50";

  return (
    <div className="rounded-md border border-copper/20 bg-paper p-5">
      <h2 className="font-display text-h4 text-maroon">Actions</h2>

      <label className="mt-4 block font-display text-small tracking-wide text-maroon" htmlFor="status">
        Status
      </label>
      <select
        id="status"
        value={status}
        disabled={busy}
        onChange={(e) => changeStatus(e.target.value as CateringOrderStatus)}
        className="mt-1 w-full rounded-md border border-copper/40 bg-paper px-3 py-2 text-body text-ink outline-none focus:border-copper disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        onClick={approve}
        disabled={busy || status === "confirmed"}
        className={`${btn} mt-5 w-full bg-olive text-cream hover:opacity-90`}
      >
        {status === "confirmed" ? "✓ Order approved" : "Approve order — notify customer"}
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => resend("customer")} disabled={busy} className={`${btn} bg-maroon text-cream hover:bg-copper hover:text-maroon`}>
          Resend customer email
        </button>
        <button onClick={() => resend("staff")} disabled={busy} className={`${btn} bg-olive text-cream hover:opacity-90`}>
          Resend staff email
        </button>
        <button onClick={() => downloadCateringOrderPdf(order)} className={`${btn} border border-maroon text-maroon hover:bg-maroon hover:text-cream`}>
          Download PDF
        </button>
      </div>

      {msg && (
        <p className={`mt-4 text-small ${msg.ok ? "text-olive" : "text-red-700"}`}>{msg.text}</p>
      )}
    </div>
  );
}
