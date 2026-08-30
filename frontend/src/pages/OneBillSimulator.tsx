import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import type { BillInquiry, ConfirmResult } from "../types";
import { formatDate, formatPkr } from "../types";

export function OneBillSimulator() {
  const [params] = useSearchParams();
  const prefill = params.get("ref") ?? "";
  const studentId = params.get("student") ?? "STU-2026-001";
  const [consumerNumber, setConsumerNumber] = useState(prefill);
  const [bill, setBill] = useState<BillInquiry | null>(null);
  const [receipt, setReceipt] = useState<ConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const paid = receipt?.transaction?.status === "SUCCESS";

  async function fetchBill() {
    setBusy(true);
    setError(null);
    setReceipt(null);
    try {
      setBill(await api.inquire(consumerNumber.trim()));
    } catch (err) {
      setBill(null);
      setError(err instanceof Error ? err.message : "Bill inquiry failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(simulateFailure = false) {
    setBusy(true);
    setError(null);
    try {
      setReceipt(await api.pay(consumerNumber.trim(), simulateFailure));
      if (bill) {
        setBill(await api.inquire(consumerNumber.trim()));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  const txn = receipt?.transaction;
  const receiptRows = useMemo(() => {
    if (!txn) {
      return [];
    }
    return [
      ["Transaction ID", txn.providerTxnId ?? `LOCAL-${txn.id}`],
      ["Consumer Number", txn.consumerNumber],
      ["Invoice Number", txn.invoiceNumber],
      ["Amount Paid", formatPkr(txn.amountPaisa)],
      ["Payment Date/Time", txn.paidAt ? formatDate(txn.paidAt) : "—"],
    ];
  }, [txn]);

  return (
    <div className="min-h-[70vh] bg-bank-900 px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-400">Member bank · 1BILL</p>
        <h1 className="font-display mt-2 text-3xl">1LINK 1BILL payment</h1>
        <p className="mt-2 text-sm text-slate-300">
          Simulated bank screen. Enter the school-issued consumer number, fetch the bill, then
          confirm. The school invoice is updated only after backend verification.
        </p>

        <div className="mt-6 rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
          <label className="block text-sm font-medium text-slate-600">
            Consumer Number / Bill Reference
            <input
              value={consumerNumber}
              onChange={(event) => setConsumerNumber(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono tracking-wider"
              placeholder="10880100000001"
            />
          </label>
          <button
            type="button"
            onClick={() => void fetchBill()}
            disabled={busy || !consumerNumber.trim()}
            className="mt-4 w-full rounded-lg bg-bank-800 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy && !bill ? "Fetching bill…" : "Fetch Bill"}
          </button>

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}

          {bill && (
            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Bill inquiry
                </h2>
                <StatusBadge status={bill.invoiceStatus} />
              </div>
              <p className="text-lg font-semibold">{bill.studentName}</p>
              <p className="text-sm text-slate-500">
                {bill.studentId} · Class {bill.className}
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt>Biller</dt>
                  <dd>{bill.billerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Invoice</dt>
                  <dd>{bill.invoiceNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Fee month</dt>
                  <dd>{bill.feeMonth}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Due date</dt>
                  <dd>{formatDate(bill.dueDate)}</dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt>Amount</dt>
                  <dd>{formatPkr(bill.amountPaisa)}</dd>
                </div>
              </dl>

              {bill.invoiceStatus !== "PAID" && (
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => void confirm(false)}
                    disabled={busy || bill.invoiceStatus === "EXPIRED"}
                    className="rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Confirm Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirm(true)}
                    disabled={busy}
                    className="text-xs text-slate-500 underline"
                  >
                    Simulate failed 1BILL response
                  </button>
                </div>
              )}
            </div>
          )}

          {txn && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  1BILL receipt
                </h3>
                <StatusBadge status={txn.status} />
              </div>
              <dl className="space-y-2 text-sm">
                {receiptRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
              {paid && (
                <p className="mt-3 text-xs text-emerald-800">
                  Confirmation sent to the school fee system. Invoice is now PAID on the backend.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="text-gold-400 underline" to={`/?student=${encodeURIComponent(studentId)}`}>
            Back to student portal
          </Link>
          <Link className="text-slate-300 underline" to="/admin">
            Open school admin
          </Link>
        </div>
      </div>
    </div>
  );
}
