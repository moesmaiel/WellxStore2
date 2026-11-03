import { mockProvider } from "./mock";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";

export function paymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "stripe" ? stripeProvider : mockProvider;
}

export type * from "./types";
