import { config } from "../config.js";
import type { PaymentProvider } from "./PaymentProvider.js";
import { JazzCashProvider } from "./providers/jazzcash/JazzCashProvider.js";
import { createOneLink1BillProvider } from "./providers/onelink1bill/OneLink1BillProvider.js";
import type { PaymentProviderId } from "./types.js";

const providers: Record<string, () => PaymentProvider> = {
  onelink1bill: createOneLink1BillProvider,
  ONELINK_1BILL: createOneLink1BillProvider,
  jazzcash: () => new JazzCashProvider(),
  JAZZCASH: () => new JazzCashProvider(),
};

export function getProvider(id?: string): PaymentProvider {
  const key = (id ?? config.paymentProvider).toLowerCase();
  const factory = providers[key] ?? providers[id ?? ""];
  if (!factory) {
    throw new Error(`Unknown payment provider: ${id ?? config.paymentProvider}`);
  }
  return factory();
}

export function defaultProviderId(): PaymentProviderId {
  return "ONELINK_1BILL";
}
