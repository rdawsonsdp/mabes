import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  getAdminUser,
  getCateringOrder,
  updateCateringOrderStatus,
  sendCateringCustomerEmail,
  sendCateringStaffEmail,
} = vi.hoisted(() => ({
  getAdminUser: vi.fn(),
  getCateringOrder: vi.fn(),
  updateCateringOrderStatus: vi.fn(),
  sendCateringCustomerEmail: vi.fn(),
  sendCateringStaffEmail: vi.fn(),
}));

vi.mock("@/app/lib/supabase/admin-auth", () => ({ getAdminUser }));
vi.mock("@/app/lib/catering/orders", () => ({ getCateringOrder, updateCateringOrderStatus }));
vi.mock("@/app/lib/email/catering-customer-template", () => ({ sendCateringCustomerEmail }));
vi.mock("@/app/lib/email/catering-staff-template", () => ({ sendCateringStaffEmail }));

import { PATCH, POST } from "./route";

function req(method: string, body: unknown) {
  return new Request("http://test/api/admin/catering/o1", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof PATCH>[0];
}
const ctx = { params: Promise.resolve({ id: "o1" }) };

beforeEach(() => {
  getAdminUser.mockReset();
  getCateringOrder.mockReset();
  updateCateringOrderStatus.mockReset();
  sendCateringCustomerEmail.mockReset().mockResolvedValue({ success: true });
  sendCateringStaffEmail.mockReset().mockResolvedValue({ success: true });
  getAdminUser.mockResolvedValue({ id: "admin" });
});

describe("PATCH /api/admin/catering/[id]", () => {
  it("401s when not signed in", async () => {
    getAdminUser.mockResolvedValue(null);
    const res = await PATCH(req("PATCH", { status: "paid" }), ctx);
    expect(res.status).toBe(401);
  });

  it("400s on an invalid status", async () => {
    const res = await PATCH(req("PATCH", { status: "shipped" }), ctx);
    expect(res.status).toBe(400);
    expect(updateCateringOrderStatus).not.toHaveBeenCalled();
  });

  it("updates the status and returns the order", async () => {
    updateCateringOrderStatus.mockResolvedValue({ id: "o1", status: "confirmed" });
    const res = await PATCH(req("PATCH", { status: "confirmed" }), ctx);
    expect(res.status).toBe(200);
    expect(updateCateringOrderStatus).toHaveBeenCalledWith("o1", "confirmed");
    expect(await res.json()).toEqual({ order: { id: "o1", status: "confirmed" } });
  });
});

describe("POST /api/admin/catering/[id] (resend)", () => {
  it("401s when not signed in", async () => {
    getAdminUser.mockResolvedValue(null);
    const res = await POST(req("POST", { action: "resend" }), ctx);
    expect(res.status).toBe(401);
  });

  it("400s on an unknown action", async () => {
    const res = await POST(req("POST", { action: "nope" }), ctx);
    expect(res.status).toBe(400);
  });

  it("404s when the order is missing", async () => {
    getCateringOrder.mockResolvedValue(null);
    const res = await POST(req("POST", { action: "resend" }), ctx);
    expect(res.status).toBe(404);
  });

  it("resends both emails by default", async () => {
    getCateringOrder.mockResolvedValue({ id: "o1", customerEmail: "c@x.com" });
    const res = await POST(req("POST", { action: "resend" }), ctx);
    expect(res.status).toBe(200);
    expect(sendCateringCustomerEmail).toHaveBeenCalledTimes(1);
    expect(sendCateringStaffEmail).toHaveBeenCalledTimes(1);
    expect(await res.json()).toEqual({ success: true, sent: ["customer", "staff"] });
  });

  it("resends only the customer email when requested", async () => {
    getCateringOrder.mockResolvedValue({ id: "o1", customerEmail: "c@x.com" });
    const res = await POST(req("POST", { action: "resend", recipient: "customer" }), ctx);
    expect(sendCateringStaffEmail).not.toHaveBeenCalled();
    expect((await res.json()).sent).toEqual(["customer"]);
  });
});
