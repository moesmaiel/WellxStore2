import "server-only";
import { query } from "../db";
import type { RenderedEmail } from "./templates";

/**
 * Emails are rendered and recorded rather than dispatched — visible in the
 * admin under Emails. Swapping in a real provider (Resend, SES, Postmark)
 * means sending 'queued' rows from here and stamping sent_at; nothing that
 * calls queueEmail() has to change.
 */
export async function queueEmail(opts: {
  to: string;
  template: string;
  email: RenderedEmail;
  payload?: Record<string, unknown>;
  orderId?: string | null;
}): Promise<void> {
  await query(
    `insert into email_outbox (to_address, subject, template, payload, body_html, order_id)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      opts.to,
      opts.email.subject,
      opts.template,
      JSON.stringify(opts.payload ?? {}),
      opts.email.html,
      opts.orderId ?? null,
    ]
  );
}
