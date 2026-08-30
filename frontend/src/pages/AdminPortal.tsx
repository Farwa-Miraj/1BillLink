import { useEffect, useState } from "react";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import type { AdminPaymentsResponse } from "../types";
import { formatDate, formatPkr } from "../types";

export function AdminPortal() {
  const [data, setData] = useState<AdminPaymentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await api.adminPayments();
        if (!cancelled) {
          setData(next);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load payments");
        }
      }
    }
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const newestSuccess = data?.payments.find((row) => row.transactionStatus === "SUCCESS");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-school-700">School Admin Portal</p>
        <h1 className="font-display text-3xl text-school-900">Collected fee payments</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Payments appear here after 1BILL confirmation. The frontend cannot mark invoices paid.
        </p>
      </div>

      {data && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-xs uppercase tracking-wider text-stone-500">Settlement account</p>
          <p className="font-display text-xl text-school-900">{data.settlement.schoolName}</p>
          <p className="text-sm text-stone-600">
            {data.settlement.bankName} · {data.settlement.maskedAccount}
          </p>
        </div>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-800">{error}</p>}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-school-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-4 py-3">Student Name</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Invoice Number</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment Method</th>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Settlement Account</th>
            </tr>
          </thead>
          <tbody>
            {data?.payments.map((row) => {
              const highlight =
                newestSuccess &&
                row.transactionId === newestSuccess.transactionId &&
                row.transactionStatus === "SUCCESS";
              return (
                <tr
                  key={`${row.transactionId}-${row.invoiceNumber}`}
                  className={highlight ? "bg-emerald-50" : "border-t border-stone-100"}
                >
                  <td className="px-4 py-3 font-medium">{row.studentName}</td>
                  <td className="px-4 py-3">{row.studentId}</td>
                  <td className="px-4 py-3">{row.invoiceNumber}</td>
                  <td className="px-4 py-3">{formatPkr(row.amountPaisa)}</td>
                  <td className="px-4 py-3">{row.paymentMethod}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.transactionId}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">{row.settlementAccount}</td>
                </tr>
              );
            })}
            {data && data.payments.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-stone-500" colSpan={8}>
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {newestSuccess?.paidAt && (
        <p className="text-sm text-stone-500">
          Latest confirmed payment: {newestSuccess.studentName} on {formatDate(newestSuccess.paidAt)}.
        </p>
      )}
    </div>
  );
}
