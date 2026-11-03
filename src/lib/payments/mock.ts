import type {
  ChargeableOrder,
  PaymentConfirmation,
  PaymentIntent,
  PaymentProvider,
} from "./types";

/**
 * Development provider: approves every charge immediately so the full order
 * pipeline can be exercised without payment credentials.
 */
export const mockProvider: PaymentProvider = {
  name: "mock",

  async createIntent(order: ChargeableOrder): Promise<PaymentIntent> {
    return {
      ref: `mock_${order.order_number}_${Date.now().toString(36)}`,
      provider: "mock",
      redirectUrl: null,
      settled: true,
    };
  },

  async confirm(ref: string): Promise<PaymentConfirmation> {
    return { ref, paid: true };
  },
};
