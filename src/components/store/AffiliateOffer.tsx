"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/**
 * The affiliate path: no cart, no order. The customer copies a discount code
 * and completes the purchase on the partner's site. Views, copies and
 * redirects are logged as redemption events instead of orders.
 */
export function AffiliateOffer({
  productId,
  code,
  url,
  brandName,
}: {
  productId: string;
  code: string;
  url: string;
  brandName: string;
}) {
  const [copied, setCopied] = useState(false);

  const track = (event: "code_viewed" | "code_copied" | "redirected") => {
    // Fire-and-forget; never block the customer on analytics.
    void fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, event }),
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    track("code_viewed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard blocked — the code is on screen to copy manually.
    }
    setCopied(true);
    track("code_copied");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-dashed border-wx-purple/40 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-wx-muted">
          Your Wellx discount code
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="flex-1 rounded-xl bg-wx-bg px-4 py-3 text-xl font-bold tracking-[0.15em] text-wx-ink">
            {code}
          </code>
          <button
            onClick={copy}
            className="wx-focus flex items-center gap-2 rounded-xl border border-wx-line px-4 py-3 text-sm font-semibold transition hover:border-wx-purple hover:text-wx-purple"
          >
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        onClick={() => track("redirected")}
        className="wx-focus flex w-full items-center justify-center gap-2 rounded-full wx-gradient px-8 py-4 font-semibold text-white shadow-lg shadow-violet-200 transition hover:opacity-90"
      >
        Continue to {brandName}
        <ExternalLink size={16} aria-hidden="true" />
      </a>

      <p className="text-center text-sm text-wx-muted">
        Apply the code at checkout on {brandName}&rsquo;s site to get your member price.
      </p>
    </div>
  );
}
