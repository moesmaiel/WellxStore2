import type {
  ChargeableOrder,
  PaymentConfirmation,
  PaymentIntent,
  PaymentProvider,
} from "./types";

/**
 * Stripe provider — not wired yet.
 *
 * To finish it:
 *  1. npm i stripe, set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
 *  2. createIntent -> stripe.checkout.sessions.create({
 *       mode: "payment",
 *       payment_method_types: ["card"],          // Link is excluded per spec
 *       line_items: [{ price_data: { currency: order.currency,
 *                                    product_data: { name: order.order_number },
 *                                    unit_amount: Math.round(order.total * 100) },
 *                      quantity: 1 }],
 *       customer_email: order.customer_email,
 *       success_url: `${origin}/api/payments/confirm?ref={CHECKOUT_SESSION_ID}`,
 *       cancel_url: `${origin}/checkout?cancelled=1`,
 *     })
 *     and return { ref: session.id, redirectUrl: session.url, settled: false }.
 *  3. confirm -> retrieve the session and return paid: session.payment_status === "paid".
 *  4. Add app/api/payments/webhook/route.ts for checkout.session.completed and
 *     call fulfillOrder() from there as well, so fulfillment survives a
 *     customer closing the tab before the redirect lands.
 *
 * fulfillOrder() in lib/fulfill.ts is already independent of the provider, so
 * none of the order pipeline changes when this is switched on.
 */
export const stripeProvider: PaymentProvider = {
  name: "stripe",

  async createIntent(_order: ChargeableOrder): Promise<PaymentIntent> {
    throw new Error(
      "Stripe is not configured yet. Set PAYMENT_PROVIDER=mock, or finish the integration in lib/payments/stripe.ts."
    );
  },

  async confirm(_ref: string): Promise<PaymentConfirmation> {
    throw new Error("Stripe is not configured yet.");
  },
};
