// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const getBucket = vi.fn();
const createBucket = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();
const storageFrom = vi.fn(() => ({ upload, createSignedUrl }));
const fakeClient = { storage: { getBucket, createBucket, from: storageFrom } };
vi.mock("@/app/lib/supabase/server", () => ({ getSupabase: () => fakeClient }));

beforeEach(() => {
  getBucket.mockResolvedValue({ data: { name: "tax-exempt-certificates" } });
  createBucket.mockResolvedValue({ data: {}, error: null });
  upload.mockResolvedValue({ error: null });
  createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://signed.example/cert" }, error: null });
});

function formRequest(file: File | null): Request {
  const form = new FormData();
  if (file) form.append("file", file);
  return new Request("http://localhost/api/catering/upload-tax-certificate", {
    method: "POST",
    body: form,
  });
}

describe("POST upload-tax-certificate", () => {
  it("rejects when no file is provided", async () => {
    const { POST } = await import("./route");
    const res = await POST(formRequest(null));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/no file/i);
  });

  it("rejects an unsupported mime type", async () => {
    const { POST } = await import("./route");
    const bad = new File(["x"], "note.txt", { type: "text/plain" });
    const res = await POST(formRequest(bad));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid file type/i);
  });

  it("uploads a PDF and returns a signed url + path", async () => {
    const { POST } = await import("./route");
    const pdf = new File([new Uint8Array([1, 2, 3])], "cert.pdf", { type: "application/pdf" });
    const res = await POST(formRequest(pdf));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://signed.example/cert");
    expect(body.path).toMatch(/\.pdf$/);
    expect(upload).toHaveBeenCalledTimes(1);
  });
});
