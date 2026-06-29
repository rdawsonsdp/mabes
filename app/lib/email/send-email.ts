import { Resend } from "resend";

// Resend wrapper. Dev-mode (no key) logs to console and returns a stub id so the
// catering submit flow works locally without a Resend account. Mirrors the
// Lexington Betty lib/email/send-email.ts pattern.

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL || "Mabe's Sandwich Shop <onboarding@resend.dev>";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string[];
}

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  cc,
}: SendEmailParams): Promise<{ success: boolean; id?: string }> {
  if (!resend) {
    console.log("--- EMAIL (dev mode, no RESEND_API_KEY) ---");
    console.log(`To: ${to}`);
    console.log(`CC: ${cc?.join(", ") || "N/A"}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reply-To: ${replyTo || "N/A"}`);
    console.log(`HTML length: ${html.length} chars`);
    console.log("--- END EMAIL ---");
    return { success: true, id: "dev-mode" };
  }

  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
    ...(cc && cc.length > 0 ? { cc } : {}),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message);
  }

  return { success: true, id: data?.id };
}
