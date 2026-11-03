import type { OrderItem, Order } from "../types";
import { confirmationLine } from "../fulfillment";
import { formatMoney } from "../pricing";

export type RenderedEmail = { subject: string; html: string };

const shell = (title: string, body: string) => `
<div style="font-family:Raleway,Helvetica,Arial,sans-serif;color:#1A1A1A;max-width:560px;margin:0 auto;padding:24px">
  <div style="background:#1A1225;padding:20px 24px;border-radius:12px 12px 0 0">
    <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.02em">Wellx <span style="color:#EC4899">Store</span></span>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #E7E3F0;border-top:0;border-radius:0 0 12px 12px">
    <h1 style="margin:0 0 16px;font-size:20px">${title}</h1>
    ${body}
  </div>
  <p style="color:#9CA3AF;font-size:12px;margin-top:16px">You are receiving this because you placed an order on Wellx Store.</p>
</div>`;

export function orderConfirmationEmail(
  order: Order,
  items: OrderItem[]
): RenderedEmail {
  const lines = items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #E7E3F0">
          <strong>${i.product_snapshot.name}</strong> × ${i.quantity}<br>
          <span style="color:#9CA3AF;font-size:13px">${confirmationLine(
            i.fulfillment_type,
            i.product_snapshot.name
          )}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #E7E3F0;text-align:right;white-space:nowrap">
          ${formatMoney(i.unit_wellx_price * i.quantity, order.currency)}
        </td>
      </tr>`
    )
    .join("");

  return {
    subject: `Your Wellx order ${order.order_number} is confirmed`,
    html: shell(
      `Thanks, ${order.customer_name.split(" ")[0]} — order ${order.order_number} is confirmed`,
      `<p>Your items are fulfilled in different ways, so they may arrive separately:</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">${lines}</table>
       <p style="text-align:right;font-size:18px"><strong>Total ${formatMoney(
         order.total,
         order.currency
       )}</strong></p>`
    ),
  };
}

export function accessCodeEmail(
  order: Order,
  item: OrderItem,
  code: string
): RenderedEmail {
  return {
    subject: `Your access code for ${item.product_snapshot.name}`,
    html: shell(
      `Here is your access code`,
      `<p>Your code for <strong>${item.product_snapshot.name}</strong> (order ${order.order_number}):</p>
       <p style="font-size:26px;font-weight:700;letter-spacing:2px;background:#F5F3FA;border:1px dashed #7C3AED;border-radius:10px;padding:16px;text-align:center">${code}</p>
       <p style="color:#9CA3AF;font-size:13px">Redeem it with the provider to activate your purchase.</p>`
    ),
  };
}

export function vendorDropShipEmail(
  order: Order,
  item: OrderItem
): RenderedEmail {
  const a = order.shipping_address;
  return {
    subject: `New Wellx order ${order.order_number} — ${item.product_snapshot.name}`,
    html: shell(
      `New order to fulfill`,
      `<p>Please fulfill the following order placed through Wellx Store.</p>
       <table style="width:100%;border-collapse:collapse;font-size:14px">
         <tr><td style="padding:6px 0;color:#9CA3AF">Order</td><td><strong>${order.order_number}</strong></td></tr>
         <tr><td style="padding:6px 0;color:#9CA3AF">Product</td><td>${item.product_snapshot.name} × ${item.quantity}</td></tr>
         <tr><td style="padding:6px 0;color:#9CA3AF">Customer</td><td>${order.customer_name}</td></tr>
         <tr><td style="padding:6px 0;color:#9CA3AF">Email</td><td>${order.customer_email}</td></tr>
         <tr><td style="padding:6px 0;color:#9CA3AF">Phone</td><td>${order.customer_phone ?? "—"}</td></tr>
         <tr><td style="padding:6px 0;color:#9CA3AF;vertical-align:top">Ship to</td><td>
           ${[a?.line1, a?.line2, a?.city, a?.state, a?.postal_code, a?.country]
             .filter(Boolean)
             .join("<br>")}
         </td></tr>
       </table>
       <p style="color:#9CA3AF;font-size:13px;margin-top:16px">Reply to this email to confirm dispatch.</p>`
    ),
  };
}
