/**
 * Newsletter sending via Resend.
 *
 * Recipients go in BCC (with `to` set to the sender) so subscribers don't see each other's
 * addresses. Sending emails on the user's behalf, so callers must gate this behind an approve step.
 */
import { ENV } from "../_core/env";

const RESEND_URL = "https://api.resend.com/emails";

export type NewsletterResult = { id: string; recipientCount: number };

export async function sendNewsletter(input: {
  subject: string;
  html: string;
  recipients: string[];
  from?: string;
}): Promise<NewsletterResult> {
  if (!ENV.resendApiKey) {
    throw new Error("Newsletter sending is not configured. Set RESEND_API_KEY in your environment.");
  }
  if (!input.subject.trim()) throw new Error("Subject is required");
  if (!input.html.trim()) throw new Error("Body is required");
  const recipients = input.recipients.map((r) => r.trim()).filter(Boolean);
  if (recipients.length === 0) throw new Error("At least one recipient is required");

  const from = input.from || ENV.newsletterFrom;

  const response = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${ENV.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [from],
      bcc: recipients,
      subject: input.subject,
      html: input.html,
    }),
  });

  const json: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = json?.message || json?.name || `${response.status} ${response.statusText}`;
    throw new Error(`Resend request failed: ${msg}`);
  }

  return { id: json?.id ?? "", recipientCount: recipients.length };
}
