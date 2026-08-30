import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../config.js";
import type { Invoice, InvoiceStatus, PaymentTransaction, SettlementAccount, Student } from "../payments/types.js";
import { applySchema } from "./schema.js";
import { seedIfEmpty } from "./seed.js";

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(path.resolve(config.databasePath));
    fs.mkdirSync(dir, { recursive: true });
    db = new Database(config.databasePath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    applySchema(db);
    seedIfEmpty(db);
  }
  return db;
}

export function listStudents(): Student[] {
  return getDb()
    .prepare("SELECT id, student_id AS studentId, name, class_name AS className FROM students ORDER BY student_id")
    .all() as Student[];
}

export function getStudent(studentId: string): Student | undefined {
  return getDb()
    .prepare(
      "SELECT id, student_id AS studentId, name, class_name AS className FROM students WHERE student_id = ?",
    )
    .get(studentId) as Student | undefined;
}

export function getCurrentInvoice(studentId: string): Invoice | undefined {
  return getDb()
    .prepare(
      `SELECT id, student_id AS studentId, invoice_number AS invoiceNumber, fee_month AS feeMonth,
              amount_paisa AS amountPaisa, due_date AS dueDate, status
       FROM invoices WHERE student_id = ? ORDER BY due_date DESC LIMIT 1`,
    )
    .get(studentId) as Invoice | undefined;
}

export function getInvoiceByNumber(invoiceNumber: string): Invoice | undefined {
  return getDb()
    .prepare(
      `SELECT id, student_id AS studentId, invoice_number AS invoiceNumber, fee_month AS feeMonth,
              amount_paisa AS amountPaisa, due_date AS dueDate, status
       FROM invoices WHERE invoice_number = ?`,
    )
    .get(invoiceNumber) as Invoice | undefined;
}

export function updateInvoiceStatus(invoiceNumber: string, status: InvoiceStatus): void {
  getDb().prepare("UPDATE invoices SET status = ? WHERE invoice_number = ?").run(status, invoiceNumber);
}

export function insertTransaction(input: {
  provider: string;
  consumerNumber: string;
  invoiceNumber: string;
  studentId: string;
  amountPaisa: number;
  status: string;
}): PaymentTransaction {
  const now = new Date().toISOString();
  const result = getDb()
    .prepare(
      `INSERT INTO payment_transactions
        (provider, consumer_number, invoice_number, student_id, amount_paisa, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.provider,
      input.consumerNumber,
      input.invoiceNumber,
      input.studentId,
      input.amountPaisa,
      input.status,
      now,
      now,
    );

  return getTransactionById(Number(result.lastInsertRowid))!;
}

export function getTransactionById(id: number): PaymentTransaction | undefined {
  return mapTransaction(
    getDb().prepare("SELECT * FROM payment_transactions WHERE id = ?").get(id),
  );
}

export function getLatestTransaction(invoiceNumber: string): PaymentTransaction | undefined {
  return mapTransaction(
    getDb()
      .prepare(
        "SELECT * FROM payment_transactions WHERE invoice_number = ? ORDER BY id DESC LIMIT 1",
      )
      .get(invoiceNumber),
  );
}

export function getPendingByConsumer(consumerNumber: string): PaymentTransaction | undefined {
  return mapTransaction(
    getDb()
      .prepare(
        `SELECT * FROM payment_transactions
         WHERE consumer_number = ? AND status = 'PENDING'
         ORDER BY id DESC LIMIT 1`,
      )
      .get(consumerNumber),
  );
}

export function getTransactionByProviderTxnId(providerTxnId: string): PaymentTransaction | undefined {
  return mapTransaction(
    getDb()
      .prepare("SELECT * FROM payment_transactions WHERE provider_txn_id = ?")
      .get(providerTxnId),
  );
}

export function getTransactionByConsumer(consumerNumber: string): PaymentTransaction | undefined {
  return mapTransaction(
    getDb()
      .prepare(
        "SELECT * FROM payment_transactions WHERE consumer_number = ? ORDER BY id DESC LIMIT 1",
      )
      .get(consumerNumber),
  );
}

export function updateTransaction(
  id: number,
  fields: {
    status: string;
    providerTxnId?: string | null;
    paidAt?: string | null;
    rawPayloadJson?: string | null;
  },
): void {
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE payment_transactions
       SET status = ?, provider_txn_id = COALESCE(?, provider_txn_id),
           paid_at = COALESCE(?, paid_at), raw_payload_json = COALESCE(?, raw_payload_json),
           updated_at = ?
       WHERE id = ?`,
    )
    .run(fields.status, fields.providerTxnId ?? null, fields.paidAt ?? null, fields.rawPayloadJson ?? null, now, id);
}

export function listTransactions(): PaymentTransaction[] {
  return (
    getDb()
      .prepare("SELECT * FROM payment_transactions ORDER BY id DESC")
      .all() as Record<string, unknown>[]
  )
    .map(mapTransaction)
    .filter((row): row is PaymentTransaction => Boolean(row));
}

export function getSettlementAccount(): SettlementAccount {
  return getDb()
    .prepare(
      `SELECT id, school_name AS schoolName, bank_name AS bankName, masked_account AS maskedAccount
       FROM settlement_accounts LIMIT 1`,
    )
    .get() as SettlementAccount;
}

function mapTransaction(row: unknown): PaymentTransaction | undefined {
  if (!row || typeof row !== "object") {
    return undefined;
  }
  const r = row as Record<string, unknown>;
  return {
    id: Number(r.id),
    provider: r.provider as PaymentTransaction["provider"],
    consumerNumber: String(r.consumer_number),
    invoiceNumber: String(r.invoice_number),
    studentId: String(r.student_id),
    amountPaisa: Number(r.amount_paisa),
    status: r.status as PaymentTransaction["status"],
    providerTxnId: (r.provider_txn_id as string | null) ?? null,
    paidAt: (r.paid_at as string | null) ?? null,
    rawPayloadJson: (r.raw_payload_json as string | null) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}
