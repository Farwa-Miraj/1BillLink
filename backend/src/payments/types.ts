export const INVOICE_STATUSES = ["UNPAID", "PENDING", "PAID", "FAILED", "EXPIRED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const TRANSACTION_STATUSES = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export type PaymentProviderId = "ONELINK_1BILL" | "JAZZCASH";

export interface Student {
  id: number;
  studentId: string;
  name: string;
  className: string;
}

export interface Invoice {
  id: number;
  studentId: string;
  invoiceNumber: string;
  feeMonth: string;
  amountPaisa: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface PaymentTransaction {
  id: number;
  provider: PaymentProviderId;
  consumerNumber: string;
  invoiceNumber: string;
  studentId: string;
  amountPaisa: number;
  status: TransactionStatus;
  providerTxnId: string | null;
  paidAt: string | null;
  rawPayloadJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementAccount {
  id: number;
  schoolName: string;
  bankName: string;
  maskedAccount: string;
}

export interface BillInquiry {
  consumerNumber: string;
  studentName: string;
  studentId: string;
  className: string;
  invoiceNumber: string;
  feeMonth: string;
  amountPaisa: number;
  dueDate: string;
  invoiceStatus: InvoiceStatus;
  billerName: string;
  paymentMethod: string;
}

export interface ProviderNotification {
  provider: PaymentProviderId;
  consumerNumber: string;
  invoiceNumber: string;
  amountPaisa: number;
  transactionId: string;
  providerStatus: string;
  paidAt: string;
  raw: Record<string, unknown>;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  notification?: ProviderNotification;
}
