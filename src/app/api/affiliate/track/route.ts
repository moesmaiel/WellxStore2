import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

const EVENTS = ["code_viewed", "code_copied", "redirected"] as const;

/** Affiliate interactions are logged as redemption events, never as orders. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId: unknown = body?.productId;
  const event: unknown = body?.event;

  if (typeof productId !== "string" || !EVENTS.includes(event as never)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // An anonymous, per-browser id so repeat views from one visitor are visible
  // as such. No personal data is stored.
  const jar = await cookies();
  let sessionId = jar.get("wellx_sid")?.value;
  if (!sessionId) sessionId = crypto.randomUUID();

  await query(
    `insert into affiliate_events (product_id, event_type, session_id) values ($1,$2,$3)`,
    [productId, event, sessionId]
  );

  const res = NextResponse.json({ ok: true });
  res.cookies.set("wellx_sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
