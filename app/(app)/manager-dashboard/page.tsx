"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Monitor, Users, CheckSquare, Target, TrendingUp, Clock } from "lucide-react";

const branchStats = [
  { branch: "Nhà hàng Hương Việt - Q.1", present: 42, total: 48, performance: "94%" },
  { branch: "Nhà hàng Hương Việt - Q.7", present: 28, total: 32, performance: "91%" },
  { branch: "Nhà hàng Hương Việt - Thủ Đức", present: 22, total: 25, performance: "93%" },
];

export default function ManagerDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard quản lý" subtitle="Tổng quan chi nhánh Nhà hàng Hương Việt - Q.1" icon={Monitor} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng nhân sự" value="126" tone="blue" icon={Users} />
        <StatCard label="Hiện diện" value="92" sub="/ 105 hôm nay" tone="green" />
        <StatCard label="Đơn chờ duyệt" value="8" tone="orange" icon={CheckSquare} />
        <StatCard label="KPI trung bình" value="87%" tone="purple" icon={Target} />
      </div>

      <Card title="Tỷ lệ hiện diện 7 ngày" className="mb-6">
        <div className="flex items-end gap-3 h-40">
          {[92, 94, 90, 91, 92, 95, 93].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-brand-600">{v}%</span>
              <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${v * 1.4}px` }} />
              <span className="text-[10px] text-slate-400">{["T2","T3","T4","T5","T6","T7","CN"][i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Chi nhánh">
        <div className="space-y-3">
          {branchStats.map((b) => (
            <div key={b.branch} className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm">{b.branch}</p>
                <p className="text-xs text-slate-500 mt-1">Hiện diện: {b.present}/{b.total}</p>
              </div>
              <StatusBadge tone="green">KPI {b.performance}</StatusBadge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
