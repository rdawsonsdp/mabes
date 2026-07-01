"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCateringCart } from "@/app/components/catering/CateringCartProvider";
import { BraintreeDropIn, type BraintreeDropInHandle } from "@/app/components/catering/BraintreeDropIn";
import { computeCateringTotals } from "@/app/lib/catering/totals";
import { meetsMinimum, earliestEventDate, CATERING_MINIMUM_CENTS, taxRatePercentLabel } from "@/app/lib/catering/config";
import { formatCents } from "@/app/lib/money";
import { ADDRESS, PHONE_DISPLAY } from "@/app/components/ContactBar";
import type { CateringOrderInput, CateringOrderRecord, FulfillmentType } from "@/app/lib/catering/types";

type Form = {
  name: string;
  email: string;
  phone: string;
  company: string;
  eventDate: string;
  eventTime: string;
  headcount: string;
  deliveryAddress: string;
  specialInstructions: string;
  taxExempt: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  eventDate: "Event Date",
  deliveryAddress: "Delivery Address",
};

export function CheckoutClient() {
  const router = useRouter();
  const { state, clear } = useCateringCart();
  const dropinRef = useRef<BraintreeDropInHandle>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState<"quote" | "order" | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    company: "",
    eventDate: state.eventDate ?? "",
    eventTime: state.eventTime ?? "",
    headcount: "",
    deliveryAddress: "",
    specialInstructions: "",
    taxExempt: false,
  });

  // Tax-exempt cert upload state
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [certName, setCertName] = useState<string | null>(null);
  const [certStatus, setCertStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  const fulfillment: FulfillmentType = state.fulfillmentType;
  const taxExemptApplied = form.taxExempt && certUrl !== null;
  // Object-form call per binding constraint (adjustment #2)
  const totals = computeCateringTotals({
    subtotalCents: state.subtotalCents,
    fulfillment,
    taxExempt: taxExemptApplied,
  });
  const belowMin = !meetsMinimum(state.subtotalCents);
  const shortfallCents = Math.max(0, CATERING_MINIMUM_CENTS - state.subtotalCents);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!EMAIL_RE.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.eventDate) e.eventDate = "Event date is required";
    else if (form.eventDate < earliestEventDate()) e.eventDate = "Choose a date at least 2 days out";
    if (fulfillment === "delivery" && !form.deliveryAddress.trim()) {
      e.deliveryAddress = "Delivery address is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleContinue() {
    if (validate()) {
      setStep(2);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  async function handleCertUpload(file: File) {
    setCertName(file.name);
    setCertStatus("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/catering/upload-tax-certificate", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Upload failed");
      const { url } = await res.json();
      setCertUrl(url);
      setCertStatus("done");
    } catch {
      setCertUrl(null);
      setCertStatus("error");
    }
  }

  async function submitOrder(isQuote: boolean) {
    setSubmitting(isQuote ? "quote" : "order");
    setSubmitError(null);
    setPayError(null);

    let paymentNonce: string | null = null;
    if (!isQuote) {
      try {
        paymentNonce = await dropinRef.current!.requestNonce();
      } catch (e) {
        setPayError(e instanceof Error ? e.message : "Payment details are incomplete.");
        setSubmitting(null);
        return;
      }
    }

    const payload: CateringOrderInput = {
      isQuote,
      fulfillmentType: fulfillment,
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || null,
      },
      event: {
        date: form.eventDate,
        time: form.eventTime.trim() || null,
        headcount: form.headcount ? Number(form.headcount) : null,
        specialInstructions: form.specialInstructions.trim() || null,
      },
      deliveryAddress: fulfillment === "delivery" ? form.deliveryAddress.trim() : null,
      taxExempt: taxExemptApplied,
      taxExemptCertificateUrl: certUrl,
      items: state.items,
      paymentNonce,
    };

    try {
      const res = await fetch("/api/catering/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 402) {
        const { error } = await res.json();
        setPayError(error || "Payment was declined.");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as { error?: string }).error || "Failed to submit your order.");
        return;
      }
      const { order } = await res.json() as { order: CateringOrderRecord };
      sessionStorage.setItem("mabes-last-catering-order", JSON.stringify(order));
      clear();
      router.push("/catering/confirmation");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(null);
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-h2 text-ink">Your catering order is empty</h1>
        <a
          href="/catering/menu"
          className="font-display mt-6 inline-block rounded-pill bg-maroon px-8 py-3 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
        >
          Browse the Catering Menu
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-maroon py-8 text-center">
        <h1 className="font-display text-h1 tracking-wide text-cream">Catering Checkout</h1>
        <p className="mt-1 text-small uppercase tracking-widest text-copper">
          Step {step} of 2 — {step === 1 ? "Details" : "Confirm"}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-6 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 1 ? (
            <div className="space-y-6">
              {Object.keys(errors).length > 0 && (
                <div className="rounded-xl border-2 border-maroon/40 bg-maroon/5 p-4">
                  <p className="font-display text-h4 text-maroon">Please complete the required fields:</p>
                  <ul className="mt-2 space-y-1 text-small text-maroon">
                    {Object.keys(errors).map((k) => (
                      <li key={k}>• {FIELD_LABELS[k] ?? k}: {errors[k]}</li>
                    ))}
                  </ul>
                </div>
              )}

              <section className="rounded-2xl border border-copper/20 bg-paper p-6">
                <h2 className="font-display mb-4 text-h3 text-ink">Contact Information</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="name" label="Name" required value={form.name} error={errors.name} onChange={(v) => update("name", v)} />
                  <Field id="email" label="Email" type="email" required value={form.email} error={errors.email} onChange={(v) => update("email", v)} />
                  <Field id="phone" label="Phone" type="tel" required value={form.phone} error={errors.phone} onChange={(v) => update("phone", v)} />
                  <Field id="company" label="Company / Organization" value={form.company} onChange={(v) => update("company", v)} />
                </div>
              </section>

              <section className="rounded-2xl border border-copper/20 bg-paper p-6">
                <h2 className="font-display mb-4 text-h3 text-ink">Event Details</h2>
                <p className="mb-4 rounded-lg bg-olive/10 px-4 py-3 text-small text-ink">
                  Catering orders require at least 2 days advance notice. Earliest date:{" "}
                  <strong>{earliestEventDate()}</strong>.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="eventDate" label="Event Date" type="date" required value={form.eventDate} error={errors.eventDate} min={earliestEventDate()} onChange={(v) => update("eventDate", v)} />
                  <Field id="eventTime" label="Event Time" type="time" value={form.eventTime} onChange={(v) => update("eventTime", v)} />
                  <Field id="headcount" label="Headcount" type="number" value={form.headcount} onChange={(v) => update("headcount", v)} />
                </div>
                <label className="mt-4 block">
                  <span className="text-small font-medium text-ink">Special Instructions</span>
                  <textarea
                    value={form.specialInstructions}
                    onChange={(e) => update("specialInstructions", e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-copper/30 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-copper/40"
                  />
                </label>
              </section>

              <section className="rounded-2xl border border-copper/20 bg-paper p-6">
                <h2 className="font-display mb-4 text-h3 text-ink">
                  Fulfillment — {fulfillment === "delivery" ? "Delivery" : "Pickup"}
                </h2>
                {fulfillment === "delivery" ? (
                  <Field id="deliveryAddress" label="Delivery Address" required value={form.deliveryAddress} error={errors.deliveryAddress} onChange={(v) => update("deliveryAddress", v)} />
                ) : (
                  <p className="text-small text-warm-gray">Pickup at {ADDRESS}. Call {PHONE_DISPLAY} with questions.</p>
                )}
              </section>

              <section className="rounded-2xl border border-copper/20 bg-paper p-6">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={form.taxExempt}
                    onChange={(e) => {
                      update("taxExempt", e.target.checked);
                      if (!e.target.checked) {
                        setCertUrl(null);
                        setCertName(null);
                        setCertStatus("idle");
                      }
                    }}
                    className="mt-1 h-5 w-5"
                  />
                  <span>
                    <span className="text-small font-medium text-ink">Tax-exempt organization</span>
                    <span className="block text-xs text-warm-gray">
                      Upload a valid certificate to waive sales tax.
                    </span>
                  </span>
                </label>
                {form.taxExempt && (
                  <div className="mt-3 pl-8">
                    {certStatus === "done" ? (
                      <p className="text-small text-olive">Certificate uploaded: {certName}</p>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-copper/40 px-4 py-3 text-small text-warm-gray hover:border-copper">
                        {certStatus === "uploading" ? "Uploading…" : "Click to upload certificate (PDF/JPG/PNG)"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCertUpload(f);
                          }}
                        />
                      </label>
                    )}
                    {certStatus === "error" && (
                      <p className="mt-1 text-small text-maroon">Upload failed — tax will apply until a valid certificate is added.</p>
                    )}
                  </div>
                )}
              </section>

              <button
                onClick={handleContinue}
                className="font-display w-full rounded-pill bg-maroon py-3.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon"
              >
                Review Order
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-2xl border border-copper/20 bg-paper p-6">
                <h2 className="font-display mb-4 text-h3 text-ink">Confirm Your {fulfillment === "delivery" ? "Delivery" : "Pickup"}</h2>
                <dl className="grid gap-2 text-small text-ink sm:grid-cols-2">
                  <Detail label="Name" value={form.name} />
                  <Detail label="Email" value={form.email} />
                  <Detail label="Phone" value={form.phone} />
                  {form.company && <Detail label="Company" value={form.company} />}
                  <Detail label="Event Date" value={form.eventDate} />
                  {form.eventTime && <Detail label="Time" value={form.eventTime} />}
                  {fulfillment === "delivery" && <Detail label="Address" value={form.deliveryAddress} />}
                  {form.specialInstructions && <Detail label="Notes" value={form.specialInstructions} />}
                </dl>
              </section>

              <BraintreeDropIn ref={dropinRef} onError={(m) => setPayError(m)} />
              {payError && <p className="text-maroon text-small">{payError}</p>}

              {submitError && (
                <p role="alert" className="rounded-lg bg-maroon/10 px-4 py-3 text-small text-maroon">{submitError}</p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => submitOrder(false)}
                  disabled={submitting !== null || belowMin}
                  className="font-display flex-1 rounded-pill bg-maroon py-3.5 text-small uppercase tracking-widest text-cream transition-colors hover:bg-copper hover:text-maroon disabled:opacity-60"
                >
                  {submitting === "order" ? "Placing…" : "Place Order & Pay"}
                </button>
                <button
                  onClick={() => submitOrder(true)}
                  disabled={submitting !== null || belowMin}
                  className="font-display flex-1 rounded-pill border border-maroon py-3.5 text-small uppercase tracking-widest text-maroon transition-colors hover:bg-maroon hover:text-cream disabled:opacity-60"
                >
                  {submitting === "quote" ? "Sending…" : "Request a Quote"}
                </button>
              </div>
              <button onClick={() => setStep(1)} className="w-full text-center text-small text-warm-gray hover:text-maroon">
                ← Back to details
              </button>
            </div>
          )}
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded-2xl border border-copper/20 bg-paper p-6">
          <h2 className="font-display mb-4 text-h3 text-ink">Order Summary</h2>
          <ul className="space-y-3">
            {state.items.map((item) => (
              <li key={item.lineId} className="flex justify-between gap-2 border-b border-copper/15 pb-3">
                <span className="min-w-0">
                  <span className="font-display block text-h4 text-ink">{item.name}</span>
                  <span className="text-xs text-warm-gray">Qty {item.quantity} × {formatCents(item.unitPriceCents)} ea.</span>
                </span>
                <span className="font-display shrink-0 text-h4 text-ink">{formatCents(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 text-small text-ink">
            <Row label="Subtotal" value={formatCents(totals.subtotalCents)} />
            <Row label="Delivery" value={formatCents(totals.deliveryFeeCents)} />
            <Row label={taxExemptApplied ? "Tax (exempt)" : `Tax (est., ${taxRatePercentLabel()})`} value={formatCents(totals.taxCents)} />
            <div className="mt-2 flex justify-between border-t border-maroon/30 pt-2">
              <span className="font-display text-h4 text-ink">Total</span>
              <span className="font-display text-h3 text-maroon">{formatCents(totals.totalCents)}</span>
            </div>
          </div>
          {belowMin && (
            <p className="mt-3 rounded-lg bg-maroon/10 px-3 py-2 text-xs text-maroon">
              Add {formatCents(shortfallCents)} more to meet the $60 catering minimum.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  min?: string;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-small font-medium text-ink">
        {label} {required && <span className="text-maroon">*</span>}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-copper/40 ${
          error ? "border-maroon" : "border-copper/30"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-maroon">{error}</span>}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-warm-gray">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-warm-gray">{label}</span>
      <span>{value}</span>
    </div>
  );
}
