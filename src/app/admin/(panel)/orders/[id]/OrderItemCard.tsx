"use client";

import { useActionState } from "react";
import { Check, Mail, Send } from "lucide-react";
import { Card, Chip, inputClass, Button } from "@/components/admin/ui";
import { formatMoney } from "@/lib/pricing";
import {
  FULFILLMENT_LABELS,
  ITEM_STATUS_LABELS,
  nextStatuses,
  statusFlow,
} from "@/lib/fulfillment";
import type { OrderItem } from "@/lib/types";
import { advanceItem, issueAccessCode, resendToVendor } from "../actions";

export function OrderItemCard({
  item,
  currency,
}: {
  item: OrderItem;
  currency: string;
}) {
  const [advanceState, advanceAction, advancing] = useActionState(advanceItem, {});
  const [codeState, codeAction, issuing] = useActionState(issueAccessCode, {});

  const flow = statusFlow(item.fulfillment_type);
  const available = nextStatuses(item.fulfillment_type, item.status);
  const currentIndex = flow.indexOf(item.status);
  const isExit = item.status === "cancelled" || item.status === "refunded";

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold">
            {item.product_snapshot.name}
            <span className="font-normal text-wx-muted"> × {item.quantity}</span>
          </p>
          <p className="text-xs text-wx-muted">
            {item.product_snapshot.brand_name ?? "No brand"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip tone="purple">{FULFILLMENT_LABELS[item.fulfillment_type]}</Chip>
            <Chip tone={isExit ? "red" : "neutral"}>{ITEM_STATUS_LABELS[item.status]}</Chip>
          </div>
        </div>
        <p className="font-semibold">
          {formatMoney(item.unit_wellx_price * item.quantity, currency)}
        </p>
      </div>

      {/* This item's own pipeline */}
      {flow.length > 0 && (
        <ol className="mt-4 flex flex-wrap items-center gap-1 text-[11px]">
          {flow.map((s, i) => (
            <li key={s} className="flex items-center gap-1">
              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  isExit
                    ? "bg-neutral-100 text-neutral-400"
                    : i < currentIndex
                      ? "bg-emerald-50 text-emerald-700"
                      : i === currentIndex
                        ? "wx-gradient text-white"
                        : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {ITEM_STATUS_LABELS[s]}
              </span>
              {i < flow.length - 1 && <span className="text-neutral-300">→</span>}
            </li>
          ))}
        </ol>
      )}

      {/* Access code: enter it, and the customer gets the email */}
      {item.fulfillment_type === "access_code" && !isExit && (
        <form action={codeAction} className="mt-4 rounded-xl bg-violet-50 p-3">
          <input type="hidden" name="item_id" value={item.id} />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wx-muted">
            Access code
          </p>
          {item.access_code ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <code className="rounded bg-white px-2 py-1 font-bold tracking-widest">
                {item.access_code}
              </code>
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <Check size={13} aria-hidden="true" /> sent to the customer
              </span>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <input
                name="access_code"
                required
                placeholder="e.g. CORE-8H2K-9PQX"
                className={`${inputClass} max-w-xs flex-1`}
              />
              <Button type="submit" disabled={issuing}>
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={13} aria-hidden="true" />
                  {issuing ? "Sending…" : "Save & email code"}
                </span>
              </Button>
            </div>
          )}
          {codeState.error && (
            <p role="alert" className="mt-2 text-xs text-red-700">
              {codeState.error}
            </p>
          )}
        </form>
      )}

      {/* Drop shipping: vendor contact and re-send */}
      {item.fulfillment_type === "drop_shipping" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-violet-50 p-3 text-xs">
          <div>
            <p className="font-semibold uppercase tracking-wide text-wx-muted">Vendor</p>
            <p className="mt-0.5">{item.vendor_email ?? "No vendor email on file"}</p>
            {item.vendor_notified_at && (
              <p className="text-wx-muted">
                Notified {new Date(item.vendor_notified_at).toLocaleString("en-GB")}
              </p>
            )}
          </div>
          {item.vendor_email && (
            <form action={resendToVendor} className="ml-auto">
              <input type="hidden" name="item_id" value={item.id} />
              <Button type="submit" variant="secondary">
                <span className="inline-flex items-center gap-1.5">
                  <Send size={13} aria-hidden="true" /> Resend to vendor
                </span>
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Status transition */}
      {available.length > 0 && (
        <form action={advanceAction} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="item_id" value={item.id} />

          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-neutral-700">
              Move to
            </span>
            <select name="status" className={`${inputClass} w-52`} defaultValue={available[0]}>
              {available.map((s) => (
                <option key={s} value={s}>
                  {ITEM_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          {item.fulfillment_type === "own_inventory" && (
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-neutral-700">
                Tracking number
              </span>
              <input
                name="tracking_number"
                defaultValue={item.tracking_number ?? ""}
                placeholder="Optional"
                className={`${inputClass} w-48`}
              />
            </label>
          )}

          <Button type="submit" disabled={advancing}>
            {advancing ? "Updating…" : "Update"}
          </Button>

          {advanceState.error && (
            <p role="alert" className="w-full text-xs text-red-700">
              {advanceState.error}
            </p>
          )}
        </form>
      )}

      {item.tracking_number && (
        <p className="mt-3 text-xs text-wx-muted">Tracking: {item.tracking_number}</p>
      )}
    </Card>
  );
}
