import { createHmac, randomUUID } from "node:crypto";
import { config } from "../../../../config.js";
import type { PaymentProvider } from "../../../PaymentProvider.js";
import type {
  BillInquiry,
  Invoice,
  Student,
  TransactionStatus,
  VerificationResult,
} from "../../../types.js";
import {
  BILLER_NAME,
  mockFailedNotification,
  mockSuccessNotification,
  PAYMENT_METHOD_LABEL,
} from "./mockResponses.js";

export class OneLink1BillMockAdapter implements PaymentProvider {
  readonly id = "ONELINK_1BILL" as const;
  readonly displayName = PAYMENT_METHOD_LABEL;

  generateConsumerNumber(invoice: Invoice): string {
    return `${config.onelinkBillerPrefix}${String(invoice.id).padStart(8, "0")}`;
  }

  formatInquiry(student: Student, invoice: Invoice, consumerNumber: string): BillInquiry {
    return {
      consumerNumber,
      studentName: student.name,
      studentId: student.studentId,
      className: student.className,
      invoiceNumber: invoice.invoiceNumber,
      feeMonth: invoice.feeMonth,
      amountPaisa: invoice.amountPaisa,
      dueDate: invoice.dueDate,
      invoiceStatus: invoice.status,
      billerName: BILLER_NAME,
      paymentMethod: this.displayName,
    };
  }

  buildPaymentNotification(input: {
    consumerNumber: string;
    invoice: Invoice;
    outcome: "SUCCESS" | "FAILED";
  }): Record<string, unknown> {
    const paidAt = new Date().toISOString();
    const transactionId = `1BILL-${randomUUID().slice(0, 8).toUpperCase()}`;
    const base = {
      consumerNumber: input.consumerNumber,
      invoiceNumber: input.invoice.invoiceNumber,
      amountPaisa: input.invoice.amountPaisa,
      transactionId,
      paidAt,
    };
    return input.outcome === "SUCCESS"
      ? mockSuccessNotification(base)
      : mockFailedNotification(base);
  }

  sign(payload: Record<string, unknown>): string {
    return createHmac("sha256", config.onelinkMockSecret)
      .update(stableStringify(payload))
      .digest("hex");
  }

  verifyNotification(payload: unknown, signature: string | undefined): VerificationResult {
    if (!payload || typeof payload !== "object") {
      return { valid: false, reason: "Empty notification payload" };
    }

    const expected = this.sign(payload as Record<string, unknown>);
    if (!signature || signature !== expected) {
      return { valid: false, reason: "Invalid 1BILL mock signature" };
    }

    const body = payload as {
      responseCode?: string;
      transaction?: {
        transactionId?: string;
        consumerNumber?: string;
        invoiceNumber?: string;
        amountPaid?: string;
        paymentDateTime?: string;
        status?: string;
      };
    };

    const txn = body.transaction;
    if (!txn?.transactionId || !txn.consumerNumber || !txn.invoiceNumber || !txn.amountPaid) {
      return { valid: false, reason: "Notification missing required transaction fields" };
    }

    const amountPaisa = Math.round(Number(txn.amountPaid) * 100);
    if (!Number.isFinite(amountPaisa) || amountPaisa <= 0) {
      return { valid: false, reason: "Invalid amount in 1BILL notification" };
    }

    return {
      valid: true,
      notification: {
        provider: this.id,
        consumerNumber: txn.consumerNumber,
        invoiceNumber: txn.invoiceNumber,
        amountPaisa,
        transactionId: txn.transactionId,
        providerStatus: txn.status ?? body.responseCode ?? "UNKNOWN",
        paidAt: txn.paymentDateTime ?? new Date().toISOString(),
        raw: payload as Record<string, unknown>,
      },
    };
  }

  mapStatus(providerStatus: string): TransactionStatus {
    const normalized = providerStatus.toUpperCase();
    if (normalized === "PAID" || normalized === "00" || normalized === "SUCCESS") {
      return "SUCCESS";
    }
    if (normalized === "EXPIRED") {
      return "EXPIRED";
    }
    return "FAILED";
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}
