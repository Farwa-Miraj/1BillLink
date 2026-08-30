import * as repo from "../db/index.js";
import { getProvider } from "./registry.js";
import type { PaymentProvider } from "./PaymentProvider.js";
import type {
  BillInquiry,
  Invoice,
  InvoiceStatus,
  PaymentProviderId,
  PaymentTransaction,
  Student,
} from "./types.js";

export class PaymentService {
  constructor(private readonly provider: PaymentProvider = getProvider()) {}

  listStudents(): Student[] {
    return repo.listStudents();
  }

  getStudentPortal(studentId: string) {
    const student = repo.getStudent(studentId);
    if (!student) {
      return null;
    }
    const invoice = this.refreshInvoiceExpiry(repo.getCurrentInvoice(studentId));
    const transaction = invoice ? repo.getLatestTransaction(invoice.invoiceNumber) : undefined;
    return { student, invoice: invoice ?? null, transaction: transaction ?? null };
  }

  initiatePayment(input: {
    studentId: string;
    invoiceNumber: string;
    provider?: PaymentProviderId;
  }) {
    if (input.provider && input.provider !== this.provider.id) {
      if (input.provider === "JAZZCASH") {
        throw Object.assign(new Error("JazzCash is not configured in this demonstration."), {
          status: 501,
        });
      }
      throw Object.assign(new Error(`Unsupported payment provider: ${input.provider}`), {
        status: 400,
      });
    }

    const student = repo.getStudent(input.studentId);
    if (!student) {
      throw Object.assign(new Error("Student not found"), { status: 404 });
    }

    const invoice = this.refreshInvoiceExpiry(repo.getInvoiceByNumber(input.invoiceNumber));
    if (!invoice || invoice.studentId !== input.studentId) {
      throw Object.assign(new Error("Invoice not found for this student"), { status: 404 });
    }

    if (invoice.status === "PAID") {
      throw Object.assign(new Error("Invoice is already paid"), { status: 409 });
    }
    if (invoice.status === "EXPIRED") {
      throw Object.assign(new Error("Invoice has expired"), { status: 409 });
    }

    const existing = repo.getLatestTransaction(invoice.invoiceNumber);
    if (existing?.status === "PENDING") {
      return {
        consumerNumber: existing.consumerNumber,
        transactionId: existing.id,
        amountPaisa: invoice.amountPaisa,
        billerName: this.provider.formatInquiry(student, invoice, existing.consumerNumber)
          .billerName,
        paymentMethod: this.provider.displayName,
        invoiceStatus: invoice.status,
        transactionStatus: existing.status,
      };
    }

    const consumerNumber = this.provider.generateConsumerNumber(invoice);
    const transaction = repo.insertTransaction({
      provider: this.provider.id,
      consumerNumber,
      invoiceNumber: invoice.invoiceNumber,
      studentId: student.studentId,
      amountPaisa: invoice.amountPaisa,
      status: "PENDING",
    });

    if (invoice.status === "UNPAID" || invoice.status === "FAILED") {
      repo.updateInvoiceStatus(invoice.invoiceNumber, "PENDING");
    }

    return {
      consumerNumber,
      transactionId: transaction.id,
      amountPaisa: invoice.amountPaisa,
      billerName: this.provider.formatInquiry(student, invoice, consumerNumber).billerName,
      paymentMethod: this.provider.displayName,
      invoiceStatus: "PENDING" as InvoiceStatus,
      transactionStatus: transaction.status,
    };
  }

  inquireBill(consumerNumber: string): BillInquiry {
    const transaction = repo.getTransactionByConsumer(consumerNumber);
    if (!transaction) {
      throw Object.assign(new Error("Bill not found for this consumer number"), { status: 404 });
    }

    const invoice = this.refreshInvoiceExpiry(repo.getInvoiceByNumber(transaction.invoiceNumber));
    const student = repo.getStudent(transaction.studentId);
    if (!invoice || !student) {
      throw Object.assign(new Error("Bill details are unavailable"), { status: 404 });
    }

    return this.provider.formatInquiry(student, invoice, consumerNumber);
  }

  /**
   * Mock 1BILL pay screen entry point. Builds a provider notification and
   * runs the same confirmation path as the webhook — never marks PAID here.
   */
  simulateNetworkPayment(consumerNumber: string, outcome: "SUCCESS" | "FAILED") {
    const pending = repo.getPendingByConsumer(consumerNumber);
    if (!pending) {
      throw Object.assign(new Error("No pending 1BILL payment for this consumer number"), {
        status: 409,
      });
    }

    const invoice = repo.getInvoiceByNumber(pending.invoiceNumber);
    if (!invoice) {
      throw Object.assign(new Error("Invoice not found"), { status: 404 });
    }

    const payload = this.provider.buildPaymentNotification({
      consumerNumber,
      invoice,
      outcome,
    });
    const signature = this.provider.sign(payload);
    return this.confirmPayment(payload, signature);
  }

  confirmPayment(payload: unknown, signature: string | undefined) {
    const verification = this.provider.verifyNotification(payload, signature);
    if (!verification.valid || !verification.notification) {
      throw Object.assign(new Error(verification.reason ?? "Payment verification failed"), {
        status: 401,
      });
    }

    const note = verification.notification;
    const mapped = this.provider.mapStatus(note.providerStatus);

    const existingByProviderId = repo.getTransactionByProviderTxnId(note.transactionId);
    if (existingByProviderId) {
      const invoice = repo.getInvoiceByNumber(existingByProviderId.invoiceNumber);
      return {
        duplicate: true,
        transaction: existingByProviderId,
        invoice,
      };
    }

    const pending = repo.getPendingByConsumer(note.consumerNumber);
    if (!pending) {
      throw Object.assign(new Error("No pending transaction matches this 1BILL notification"), {
        status: 409,
      });
    }

    if (pending.invoiceNumber !== note.invoiceNumber) {
      this.failTransaction(pending.id, pending.invoiceNumber, payload, note.transactionId);
      throw Object.assign(new Error("Invoice number does not match the pending payment"), {
        status: 422,
      });
    }

    if (pending.amountPaisa !== note.amountPaisa) {
      this.failTransaction(pending.id, pending.invoiceNumber, payload, note.transactionId);
      throw Object.assign(new Error("Paid amount does not match the invoice"), { status: 422 });
    }

    if (mapped !== "SUCCESS") {
      this.failTransaction(pending.id, pending.invoiceNumber, payload, note.transactionId);
      const invoice = repo.getInvoiceByNumber(pending.invoiceNumber);
      return {
        duplicate: false,
        transaction: repo.getTransactionById(pending.id),
        invoice,
      };
    }

    repo.updateTransaction(pending.id, {
      status: "SUCCESS",
      providerTxnId: note.transactionId,
      paidAt: note.paidAt,
      rawPayloadJson: JSON.stringify(note.raw),
    });
    repo.updateInvoiceStatus(pending.invoiceNumber, "PAID");

    return {
      duplicate: false,
      transaction: repo.getTransactionById(pending.id),
      invoice: repo.getInvoiceByNumber(pending.invoiceNumber),
    };
  }

  listAdminPayments() {
    const settlement = repo.getSettlementAccount();
    const rows = repo.listTransactions().map((txn) => {
      const student = repo.getStudent(txn.studentId);
      const invoice = repo.getInvoiceByNumber(txn.invoiceNumber);
      return {
        studentName: student?.name ?? "Unknown",
        studentId: txn.studentId,
        invoiceNumber: txn.invoiceNumber,
        amountPaisa: txn.amountPaisa,
        paymentMethod: this.provider.displayName,
        transactionId: txn.providerTxnId ?? `LOCAL-${txn.id}`,
        status: txn.status === "SUCCESS" ? "PAID" : txn.status,
        transactionStatus: txn.status,
        settlementAccount: settlement.bankName,
        consumerNumber: txn.consumerNumber,
        paidAt: txn.paidAt,
        feeMonth: invoice?.feeMonth ?? null,
      };
    });

    return { settlement, payments: rows };
  }

  getSettlementView() {
    const settlement = repo.getSettlementAccount();
    const payments = this.listAdminPayments().payments;
    const latestSuccess = payments.find((row) => row.transactionStatus === "SUCCESS") ?? null;
    return { settlement, latestSuccess, payments };
  }

  private failTransaction(
    transactionId: number,
    invoiceNumber: string,
    payload: unknown,
    providerTxnId: string,
  ) {
    repo.updateTransaction(transactionId, {
      status: "FAILED",
      providerTxnId,
      rawPayloadJson: JSON.stringify(payload),
    });
    const invoice = repo.getInvoiceByNumber(invoiceNumber);
    if (invoice && invoice.status === "PENDING") {
      repo.updateInvoiceStatus(invoiceNumber, "UNPAID");
    }
  }

  private refreshInvoiceExpiry(invoice: Invoice | undefined): Invoice | undefined {
    if (!invoice) {
      return undefined;
    }
    if (invoice.status === "PAID" || invoice.status === "EXPIRED") {
      return invoice;
    }
    const due = new Date(`${invoice.dueDate}T23:59:59.000Z`);
    if (Number.isNaN(due.getTime()) || due >= new Date()) {
      return invoice;
    }
    repo.updateInvoiceStatus(invoice.invoiceNumber, "EXPIRED");
    const latest = repo.getLatestTransaction(invoice.invoiceNumber);
    if (latest?.status === "PENDING") {
      repo.updateTransaction(latest.id, { status: "EXPIRED" });
    }
    return { ...invoice, status: "EXPIRED" };
  }
}

export const paymentService = new PaymentService();
