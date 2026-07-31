import { type ReactNode } from "react";
import { cn } from "../lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-[#dc2626]",
        className,
      )}
    />
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-neutral-500">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 py-8", className)}>{children}</div>;
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b-2 border-[#f59e0b] pb-4">
      <h1 className="heading text-3xl text-neutral-900 md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-neutral-600">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white/60 px-6 py-12 text-center text-neutral-500">
      {children}
    </div>
  );
}

export function TermTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (t: "term1" | "term2" | "term3" | "term4") => void;
}) {
  const terms = [
    ["term1", "Term 1"],
    ["term2", "Term 2"],
    ["term3", "Term 3"],
    ["term4", "Term 4"],
  ] as const;
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {terms.map(([val, label]) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
            value === val
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="heading mb-4 text-lg">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
      <div className={cn("mt-1 text-3xl font-extrabold", accent ?? "text-neutral-900")}>{value}</div>
    </div>
  );
}
