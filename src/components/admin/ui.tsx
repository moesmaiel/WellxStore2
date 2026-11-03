import clsx from "clsx";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("rounded-2xl border border-wx-line bg-white", className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block text-sm", className)}>
      <span className="mb-1 block font-medium text-neutral-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-wx-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "wx-focus w-full rounded-xl border border-wx-line bg-white px-3 py-2 text-sm outline-none";

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      {...props}
      className={clsx(
        "wx-focus rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60",
        variant === "primary" && "wx-gradient text-white hover:opacity-90",
        variant === "secondary" &&
          "border border-wx-line bg-white text-wx-ink hover:border-wx-purple",
        variant === "danger" && "bg-red-50 text-red-700 hover:bg-red-100",
        className
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "purple" | "green" | "red" | "amber";
}) {
  return (
    <span
      className={clsx(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1",
        tone === "neutral" && "bg-neutral-50 text-neutral-600 ring-neutral-200",
        tone === "purple" && "bg-violet-50 text-violet-700 ring-violet-200",
        tone === "green" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
        tone === "red" && "bg-red-50 text-red-700 ring-red-200",
        tone === "amber" && "bg-amber-50 text-amber-700 ring-amber-200"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-wx-line bg-white p-10 text-center text-sm text-wx-muted">
      {children}
    </div>
  );
}
