// Validation + normalization for the VIP list signup (the scroll-triggered
// popup). Pure and dependency-free so it runs on the server (API route) and is
// easy to unit test.

export type VipSignupInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  consent?: unknown;
};

export type VipSignup = {
  name: string;
  email: string;
  phone: string | null;
  consentEmail: boolean;
  consentSms: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateVipSignup(
  input: VipSignupInput
): { ok: true; value: VipSignup } | { ok: false; error: string } {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const consent = input.consent === true;

  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (!consent) return { ok: false, error: "Please agree to receive updates to join." };

  return {
    ok: true,
    value: {
      name,
      email,
      phone: phone || null,
      consentEmail: true,
      // Only claim text-message consent when we actually have a number to text.
      consentSms: phone.length > 0,
    },
  };
}
