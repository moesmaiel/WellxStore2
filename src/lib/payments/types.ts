export type PaymentIntent = {
  ref: string;
  provider: string;
  /** Where to send the customer to pay. Null when no redirect is needed. */
  redirectUrl: string | null;
  /** True when the provider settled immediately (mock provider). */
  settled: boolean;
};

export type PaymentConfirmation = {
  ref: string;
  paid: boolean;
};

export type ChargeableOrder = {
  id: string;
  order_number: string;
  total: number;
  currency: string;
  customer_email: string;
};

export interface PaymentProvider {
  readonly name: string;
  createIntent(order: ChargeableOrder): Promise<PaymentIntent>;
  confirm(ref: string): Promise<PaymentConfirmation>;
}
