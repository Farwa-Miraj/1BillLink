const styles: Record<string, string> = {
  UNPAID: "bg-amber-100 text-amber-900",
  PENDING: "bg-sky-100 text-sky-900",
  PAID: "bg-emerald-100 text-emerald-900",
  SUCCESS: "bg-emerald-100 text-emerald-900",
  FAILED: "bg-rose-100 text-rose-900",
  EXPIRED: "bg-stone-200 text-stone-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${styles[status] ?? "bg-stone-100 text-stone-700"}`}
    >
      {status}
    </span>
  );
}
