export type InvoiceStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "EXPIRED";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED";

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
  provider: string;
  consumerNumber: string;
  invoiceNumber: string;
  studentId: string;
  amountPaisa: number;
  status: TransactionStatus;
  providerTxnId: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPortalData {
  student: Student;
  invoice: Invoice | null;
  transaction: PaymentTransaction | null;
}

export interface InitiateResult {
  consumerNumber: string;
  transactionId: number;
  amountPaisa: number;
  billerName: string;
  paymentMethod: string;
  invoiceStatus: InvoiceStatus;
  transactionStatus: TransactionStatus;
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

export interface ConfirmResult {
  duplicate: boolean;
  transaction: PaymentTransaction | null;
  invoice: Invoice | null;
}

export interface AdminPayment {
  studentName: string;
  studentId: string;
  invoiceNumber: string;
  amountPaisa: number;
  paymentMethod: string;
  transactionId: string;
  status: string;
  transactionStatus: TransactionStatus;
  settlementAccount: string;
  consumerNumber: string;
  paidAt: string | null;
  feeMonth: string | null;
}

export interface SettlementAccount {
  id: number;
  schoolName: string;
  bankName: string;
  maskedAccount: string;
}

export interface AdminPaymentsResponse {
  settlement: SettlementAccount;
  payments: AdminPayment[];
}

export interface SettlementView {
  settlement: SettlementAccount;
  latestSuccess: AdminPayment | null;
  payments: AdminPayment[];
}

export function formatPkr(amountPaisa: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amountPaisa / 100);
}

export function formatDate(value: string): string {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(value.includes("T") ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}
