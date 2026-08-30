import type Database from "better-sqlite3";

export function applySchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY,
      student_id TEXT NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      fee_month TEXT NOT NULL,
      amount_paisa INTEGER NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY,
      provider TEXT NOT NULL,
      consumer_number TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      student_id TEXT NOT NULL,
      amount_paisa INTEGER NOT NULL,
      status TEXT NOT NULL,
      provider_txn_id TEXT,
      paid_at TEXT,
      raw_payload_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settlement_accounts (
      id INTEGER PRIMARY KEY,
      school_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      masked_account TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_txn_consumer ON payment_transactions(consumer_number);
    CREATE INDEX IF NOT EXISTS idx_txn_provider_id ON payment_transactions(provider_txn_id);
    CREATE INDEX IF NOT EXISTS idx_txn_invoice ON payment_transactions(invoice_number);
  `);
}
