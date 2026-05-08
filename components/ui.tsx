import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-11 w-11 rounded-2xl bg-brand-50 grid place-items-center">
            <Icon size={22} className="text-brand-600" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/* ---------- Stat Card ---------- */
type Tone = "blue" | "green" | "orange" | "purple" | "red" | "gray";

const toneMap: Record<Tone, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-700", iconBg: "bg-blue-100" },
  green: { bg: "bg-emerald-50", text: "text-emerald-700", iconBg: "bg-emerald-100" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", iconBg: "bg-orange-100" },
  purple: { bg: "bg-violet-50", text: "text-violet-700", iconBg: "bg-violet-100" },
  red: { bg: "bg-rose-50", text: "text-rose-700", iconBg: "bg-rose-100" },
  gray: { bg: "bg-slate-50", text: "text-slate-600", iconBg: "bg-slate-100" },
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  icon?: LucideIcon;
}

export function StatCard({ label, value, sub, tone = "blue", icon: Icon }: StatCardProps) {
  const t = toneMap[tone];
  return (
    <div className={cn("rounded-2xl p-4 md:p-5", t.bg)}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className={cn("text-xs font-semibold uppercase tracking-wide opacity-80", t.text)}>{label}</p>
        {Icon && (
          <div className={cn("h-9 w-9 rounded-xl grid place-items-center", t.iconBg)}>
            <Icon size={18} className={t.text} />
          </div>
        )}
      </div>
      <p className={cn("text-2xl md:text-3xl font-extrabold", t.text)}>{value}</p>
      {sub && <p className={cn("text-xs mt-1 opacity-70", t.text)}>{sub}</p>}
    </div>
  );
}

/* ---------- Status Badge ---------- */

const badgeStyles: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-violet-100 text-violet-700",
  red: "bg-rose-100 text-rose-700",
  gray: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ children, tone = "blue", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", badgeStyles[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({
  title,
  children,
  action,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-100 bg-white p-5 shadow-card", className)}>
      {title && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/* ---------- Empty State ---------- */
export function EmptyState({ title = "Chưa có dữ liệu", subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 grid place-items-center mb-4">
        <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
