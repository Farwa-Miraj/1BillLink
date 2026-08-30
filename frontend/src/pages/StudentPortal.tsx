import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import type { InitiateResult, Student, StudentPortalData } from "../types";
import { formatDate, formatPkr } from "../types";

export function StudentPortal() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("student") ?? "STU-2026-001";
  const [students, setStudents] = useState<Student[]>([]);
  const [data, setData] = useState<StudentPortalData | null>(null);
  const [initiated, setInitiated] = useState<InitiateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  async function load(studentId: string) {
    setLoading(true);
    setError(null);
    try {
      const [list, portal] = await Promise.all([api.listStudents(), api.getStudent(studentId)]);
      setStudents(list.students);
      setData(portal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (data?.invoice?.status !== "PENDING") {
      return;
    }
    const timer = window.setInterval(() => {
      void api.getStudent(selectedId).then(setData).catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [data?.invoice?.status, selectedId]);

  async function onPay() {
    if (!data?.invoice) {
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const result = await api.initiate(data.student.studentId, data.invoice.invoiceNumber);
      setInitiated(result);
      await load(data.student.studentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
    } finally {
      setPaying(false);
    }
  }

  const invoice = data?.invoice;
  const transaction = data?.transaction;
  const consumerNumber = initiated?.consumerNumber ?? transaction?.consumerNumber;
  const canPay = invoice && (invoice.status === "UNPAID" || invoice.status === "FAILED");
  const awaitingPay = invoice?.status === "PENDING" && consumerNumber;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-school-700">Student / Parent Portal</p>
          <h1 className="font-display text-3xl text-school-900">Fee invoice</h1>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-stone-500">Viewing as</span>
          <select
            className="rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={selectedId}
            onChange={(event) => {
              setInitiated(null);
              setParams({ student: event.target.value });
            }}
          >
            {students.map((student) => (
              <option key={student.studentId} value={student.studentId}>
                {student.name} ({student.studentId})
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-800">{error}</p>}
      {loading && <p className="text-stone-500">Loading student record…</p>}

      {data && invoice && (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
              Student information
            </h2>
            <dl className="space-y-3">
              <Row label="Student Name" value={data.student.name} />
              <Row label="Student ID" value={data.student.studentId} />
              <Row label="Class" value={data.student.className} />
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                Current fee invoice
              </h2>
              <StatusBadge status={invoice.status} />
            </div>
            <dl className="space-y-3">
              <Row label="Invoice Number" value={invoice.invoiceNumber} />
              <Row label="Fee Month" value={invoice.feeMonth} />
              <Row label="Amount" value={formatPkr(invoice.amountPaisa)} />
              <Row label="Due Date" value={formatDate(invoice.dueDate)} />
              <Row label="Payment Status" value={invoice.status} />
            </dl>
          </section>
        </div>
      )}

      {invoice && (
        <section className="rounded-2xl bg-school-800 p-6 text-white shadow-sm">
          <h2 className="font-display text-2xl">Pay via 1LINK 1BILL</h2>
          <p className="mt-2 max-w-2xl text-sm text-school-100">
            The school system issues a Consumer Number / Bill Reference. Payment is confirmed only
            after the mock 1BILL network notifies the backend — this page never marks an invoice as
            paid.
          </p>

          {canPay && (
            <button
              type="button"
              onClick={() => void onPay()}
              disabled={paying}
              className="mt-5 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-school-900 disabled:opacity-60"
            >
              {paying ? "Generating bill reference…" : "Pay via 1LINK 1BILL"}
            </button>
          )}

          {awaitingPay && consumerNumber && (
            <div className="mt-5 space-y-3 rounded-xl bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wider text-gold-400">
                Consumer Number / Bill Reference
              </p>
              <p className="font-mono text-2xl tracking-widest">{consumerNumber}</p>
              {transaction && (
                <p className="text-sm text-school-100">
                  School transaction {transaction.id} is <StatusBadge status={transaction.status} />
                </p>
              )}
              <Link
                to={`/1bill?ref=${encodeURIComponent(consumerNumber)}&student=${encodeURIComponent(data!.student.studentId)}`}
                className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-school-900"
              >
                Pay at 1LINK 1BILL
              </Link>
            </div>
          )}

          {invoice.status === "PAID" && (
            <p className="mt-4 text-sm text-emerald-200">
              This invoice was confirmed by 1LINK 1BILL and is marked PAID by the school backend.
              Settlement destination: Allied Bank Limited (ABL).
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stone-100 pb-2 last:border-0">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-school-900">{value}</dd>
    </div>
  );
}
