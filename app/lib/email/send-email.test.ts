import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoisted mock for the resend SDK so we can assert it is/ isn't called.
const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

describe("sendEmail", () => {
  const ORIGINAL = process.env.RESEND_API_KEY;
  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
  });
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = ORIGINAL;
  });

  it("takes the dev-mode branch with no API key and does not call Resend", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendEmail } = await import("./send-email");
    const res = await sendEmail({ to: "a@b.com", subject: "Hi", html: "<p>hi</p>" });
    expect(res).toEqual({ success: true, id: "dev-mode" });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("calls Resend with from/to/subject/html and replyTo when key is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    sendMock.mockResolvedValue({ data: { id: "abc123" }, error: null });
    const { sendEmail } = await import("./send-email");
    const res = await sendEmail({
      to: "cust@example.com",
      subject: "Order MB-1042",
      html: "<p>thanks</p>",
      replyTo: "mabesdeli@gmail.com",
    });
    expect(res).toEqual({ success: true, id: "abc123" });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const arg = sendMock.mock.calls[0][0];
    expect(arg.to).toBe("cust@example.com");
    expect(arg.subject).toBe("Order MB-1042");
    expect(arg.replyTo).toBe("mabesdeli@gmail.com");
    expect(arg.from).toContain("Mabe");
  });

  it("throws on a Resend error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    sendMock.mockResolvedValue({ data: null, error: { message: "bad recipient" } });
    const { sendEmail } = await import("./send-email");
    await expect(
      sendEmail({ to: "x", subject: "s", html: "h" })
    ).rejects.toThrow("bad recipient");
  });
});
