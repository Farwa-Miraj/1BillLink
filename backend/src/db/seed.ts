import type Database from "better-sqlite3";
import { config } from "../config.js";

const EXTRA_UNPAID_STUDENTS = [
  { studentId: "STU-2026-003", name: "Hassan Ali", className: "9-A", amountPaisa: 1_400_000 },
  { studentId: "STU-2026-004", name: "Fatima Noor", className: "7-C", amountPaisa: 1_100_000 },
  { studentId: "STU-2026-005", name: "Bilal Ahmed", className: "10-B", amountPaisa: 1_500_000 },
  { studentId: "STU-2026-006", name: "Ayesha Siddiqui", className: "6-A", amountPaisa: 1_000_000 },
  { studentId: "STU-2026-007", name: "Usman Tariq", className: "11-A", amountPaisa: 1_800_000 },
  { studentId: "STU-2026-008", name: "Zainab Hussain", className: "8-A", amountPaisa: 1_200_000 },
  { studentId: "STU-2026-009", name: "Omar Farooq", className: "9-B", amountPaisa: 1_450_000 },
  { studentId: "STU-2026-010", name: "Hira Sheikh", className: "12-A", amountPaisa: 2_000_000 },
  { studentId: "STU-2026-011", name: "Danish Raza", className: "10-C", amountPaisa: 1_550_000 },
  { studentId: "STU-2026-012", name: "Maryam Iqbal", className: "7-A", amountPaisa: 1_150_000 },
  { studentId: "STU-2026-013", name: "Hamza Malik", className: "11-B", amountPaisa: 1_750_000 },
  { studentId: "STU-2026-014", name: "Sana Javed", className: "5-B", amountPaisa: 900_000 },
  { studentId: "STU-2026-015", name: "Ali Haider", className: "8-C", amountPaisa: 1_250_000 },
  { studentId: "STU-2026-016", name: "Nida Aslam", className: "9-C", amountPaisa: 1_400_000 },
  { studentId: "STU-2026-017", name: "Rehan Qureshi", className: "12-B", amountPaisa: 2_000_000 },
  { studentId: "STU-2026-018", name: "Rabia Khan", className: "6-B", amountPaisa: 1_050_000 },
  { studentId: "STU-2026-019", name: "Taha Imran", className: "4-A", amountPaisa: 800_000 },
  { studentId: "STU-2026-020", name: "Mehwish Anwar", className: "10-A", amountPaisa: 1_500_000 },
  { studentId: "STU-2026-021", name: "Shahzaib Butt", className: "11-C", amountPaisa: 1_800_000 },
  { studentId: "STU-2026-022", name: "Laiba Yousaf", className: "7-B", amountPaisa: 1_100_000 },
];

export function seedIfEmpty(db: Database.Database): void {
  const count = db.prepare("SELECT COUNT(*) AS n FROM students").get() as { n: number };
  if (count.n === 0) {
    seedBaseDemo(db);
  }
  seedExtraUnpaidStudents(db);
}

function seedBaseDemo(db: Database.Database): void {
  const insertStudent = db.prepare(
    "INSERT INTO students (student_id, name, class_name) VALUES (?, ?, ?)",
  );
  const insertInvoice = db.prepare(
    `INSERT INTO invoices (student_id, invoice_number, fee_month, amount_paisa, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertTxn = db.prepare(
    `INSERT INTO payment_transactions
      (provider, consumer_number, invoice_number, student_id, amount_paisa, status, provider_txn_id, paid_at, raw_payload_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertSettlement = db.prepare(
    "INSERT INTO settlement_accounts (school_name, bank_name, masked_account) VALUES (?, ?, ?)",
  );

  const seed = db.transaction(() => {
    insertStudent.run("STU-2026-001", "Ahmed Khan", "10-A");
    insertStudent.run("STU-2026-002", "Sara Malik", "8-B");

    insertInvoice.run(
      "STU-2026-001",
      "INV-2026-08-001",
      "August 2026",
      1_500_000,
      "2026-09-10",
      "UNPAID",
    );
    insertInvoice.run(
      "STU-2026-002",
      "INV-2026-07-002",
      "July 2026",
      1_200_000,
      "2026-07-15",
      "PAID",
    );

    const saraInvoice = db
      .prepare("SELECT id FROM invoices WHERE invoice_number = ?")
      .get("INV-2026-07-002") as { id: number };
    const saraConsumer = `${config.onelinkBillerPrefix}${String(saraInvoice.id).padStart(8, "0")}`;
    const paidAt = "2026-07-12T09:20:00.000Z";
    const now = paidAt;

    insertTxn.run(
      "ONELINK_1BILL",
      saraConsumer,
      "INV-2026-07-002",
      "STU-2026-002",
      1_200_000,
      "SUCCESS",
      "1BILL-DEMO-SEED-002",
      paidAt,
      JSON.stringify({
        responseCode: "00",
        responseMessage: "Seeded historical payment",
        transaction: {
          transactionId: "1BILL-DEMO-SEED-002",
          consumerNumber: saraConsumer,
          invoiceNumber: "INV-2026-07-002",
          amountPaid: "12000.00",
          currency: "PKR",
          paymentDateTime: paidAt,
          status: "PAID",
          channel: "1BILL",
          settlementBank: "Allied Bank Limited (ABL)",
        },
      }),
      now,
      now,
    );

    insertSettlement.run(
      "Greenfield Academy",
      "Allied Bank Limited (ABL)",
      "PK** ABL **** 4521",
    );
  });

  seed();
}

function seedExtraUnpaidStudents(db: Database.Database): void {
  const insertStudent = db.prepare(
    "INSERT OR IGNORE INTO students (student_id, name, class_name) VALUES (?, ?, ?)",
  );
  const insertInvoice = db.prepare(
    `INSERT OR IGNORE INTO invoices (student_id, invoice_number, fee_month, amount_paisa, due_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const insertAll = db.transaction(() => {
    for (const student of EXTRA_UNPAID_STUDENTS) {
      const suffix = student.studentId.slice(-3);
      insertStudent.run(student.studentId, student.name, student.className);
      insertInvoice.run(
        student.studentId,
        `INV-2026-08-${suffix}`,
        "August 2026",
        student.amountPaisa,
        "2026-09-10",
        "UNPAID",
      );
    }
  });

  insertAll();
}
