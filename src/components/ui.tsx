import Link from "@/components/Link";
import type { ReactNode } from "react";

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "amber" | "rose" }) {
  const cls = {
    muted: "border-line text-muted",
    accent: "border-transparent bg-accent-soft text-accent-fg",
    amber: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
    rose: "border-transparent bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-200",
  }[tone];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-card p-5 ${className}`}>{children}</div>;
}

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span>›</span>}
          {it.href ? (
            <Link href={it.href} className="hover:text-accent hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="text-fg">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const v =
    variant === "primary"
      ? "bg-accent text-white hover:opacity-90 disabled:opacity-40"
      : "border border-line hover:bg-accent-soft disabled:opacity-40";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`rounded-lg px-4 py-2 text-sm font-semibold ${v} ${className}`}>
      {children}
    </button>
  );
}

/** Renders plain text keeping line breaks. */
export function Text({ children }: { children: string }) {
  return <span className="whitespace-pre-line">{children}</span>;
}
