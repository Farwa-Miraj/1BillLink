import type {
  BillInquiry,
  Invoice,
  PaymentProviderId,
  Student,
  TransactionStatus,
  VerificationResult,
} from "./types.js";

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  readonly displayName: string;

  generateConsumerNumber(invoice: Invoice): string;
  formatInquiry(student: Student, invoice: Invoice, consumerNumber: string): BillInquiry;
  buildPaymentNotification(input: {
    consumerNumber: string;
    invoice: Invoice;
    outcome: "SUCCESS" | "FAILED";
  }): Record<string, unknown>;
  sign(payload: Record<string, unknown>): string;
  verifyNotification(payload: unknown, signature: string | undefined): VerificationResult;
  mapStatus(providerStatus: string): TransactionStatus;
}
