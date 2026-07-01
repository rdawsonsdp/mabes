import { describe, it, expect } from "vitest";
import { validateVipSignup } from "./validation";

describe("validateVipSignup", () => {
  it("accepts a valid signup and normalizes the email", () => {
    const res = validateVipSignup({ name: "Connie", email: " Connie@MABES.com ", consent: true });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.email).toBe("connie@mabes.com");
      expect(res.value.name).toBe("Connie");
      expect(res.value.phone).toBeNull();
      expect(res.value.consentEmail).toBe(true);
      expect(res.value.consentSms).toBe(false); // no phone → no SMS consent
    }
  });

  it("claims SMS consent only when a phone number is provided", () => {
    const res = validateVipSignup({ name: "Sam", email: "sam@x.com", phone: "312-555-0100", consent: true });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.phone).toBe("312-555-0100");
      expect(res.value.consentSms).toBe(true);
    }
  });

  it("rejects a missing name", () => {
    expect(validateVipSignup({ name: "", email: "a@b.com", consent: true })).toMatchObject({ ok: false });
  });

  it("rejects an invalid email", () => {
    expect(validateVipSignup({ name: "Ann", email: "not-an-email", consent: true })).toMatchObject({ ok: false });
  });

  it("rejects when consent is not given", () => {
    expect(validateVipSignup({ name: "Ann", email: "a@b.com", consent: false })).toMatchObject({ ok: false });
  });
});
