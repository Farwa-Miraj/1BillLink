import { useEffect, useState } from "react";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import type { SettlementView } from "../types";
import { formatDate, formatPkr } from "../types";

const STEPS = [
  "Student / Parent",
  "1LINK 1BILL Payment",
  "Payment Confirmation",
  "School Fee Management System",
  "Invoice Automatically Marked as PAID",
  "Settlement to School's Allied Bank Limited (ABL) Account",
];

function activeIndex(view: SettlementView | null): number {
  const latest = view?.payments[0];
  if (!latest) {
    return 0;
  }
  if (latest.transactionStatus === "SUCCESS") {
    return STEPS.length - 1;
  }
  if (latest.transactionStatus === "FAILED" || latest.transactionStatus === "EXPIRED") {
    return 2;
  }
  if (latest.transactionStatus === "PENDING") {
    return 1;
  }
  return 0;
}

export function SettlementFlow() {
  const [view, setView] = useState<SettlementView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .settlement()
      .then(setView)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  const current = activeIndex(view);
  const latest = view?.latestSuccess;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-widest text-school-700">Settlement demonstration</p>
        <h1 className="font-display text-3xl text-school-900">Payment pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          1LINK 1BILL is the payment rail. Allied Bank Limited (ABL) is the school&apos;s settlement
          destination — not the parent&apos;s payment method.
        </p>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-rose-800">{error}</p>}

      <ol className="space-y-0">
        {STEPS.map((step, index) => {
          const done = index <= current && Boolean(view);
          return (
            <li key={step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    done ? "bg-school-800 text-white" : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {index + 1}
                </span>
                {index < STEPS.length - 1 && (
                  <span className={`h-10 w-px ${done ? "bg-school-800" : "bg-stone-300"}`} />
                )}
              </div>
              <div className="pt-1">
                <p className={`font-medium ${done ? "text-school-900" : "text-stone-500"}`}>{step}</p>
                {index === STEPS.length - 1 && view && (
                  <p className="text-sm text-stone-500">
                    {view.settlement.bankName} · {view.settlement.maskedAccount}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {latest && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Latest settled payment
          </h2>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="text-stone-500">Student: </span>
              {latest.studentName} ({latest.studentId})
            </p>
            <p>
              <span className="text-stone-500">Invoice: </span>
              {latest.invoiceNumber}
            </p>
            <p>
              <span className="text-stone-500">Amount: </span>
              {formatPkr(latest.amountPaisa)}
            </p>
            <p>
              <span className="text-stone-500">Method: </span>
              {latest.paymentMethod}
            </p>
            <p>
              <span className="text-stone-500">Transaction: </span>
              {latest.transactionId}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-stone-500">Status: </span>
              <StatusBadge status={latest.status} />
            </p>
            {latest.paidAt && (
              <p>
                <span className="text-stone-500">Paid: </span>
                {formatDate(latest.paidAt)}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
