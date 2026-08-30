import type { PaymentProvider } from "../../PaymentProvider.js";
import type {
  BillInquiry,
  Invoice,
  Student,
  TransactionStatus,
  VerificationResult,
} from "../../types.js";

export class JazzCashProvider implements PaymentProvider {
  readonly id = "JAZZCASH" as const;
  readonly displayName = "JazzCash";

  generateConsumerNumber(_invoice: Invoice): string {
    throw notConfigured();
  }

  formatInquiry(_student: Student, _invoice: Invoice, _consumerNumber: string): BillInquiry {
    throw notConfigured();
  }

  buildPaymentNotification(): Record<string, unknown> {
    throw notConfigured();
  }

  sign(_payload: Record<string, unknown>): string {
    throw notConfigured();
  }

  verifyNotification(_payload: unknown, _signature: string | undefined): VerificationResult {
    throw notConfigured();
  }

  mapStatus(_providerStatus: string): TransactionStatus {
    throw notConfigured();
  }
}

function notConfigured(): Error {
  return new Error("JazzCash is not configured. Add a provider implementation to enable it.");
}
