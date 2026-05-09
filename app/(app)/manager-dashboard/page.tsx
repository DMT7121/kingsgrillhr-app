"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Monitor, Users, CheckSquare, Target } from "lucide-react";
import { hrData, DashboardStats, Employee } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hrData.dashboard.stats(),
      hrData.employees.list(),
    ]).then(([s, emps]) => {
      setStats(s);
      setEmployees(emps);
      setLoading(false);
    });
  }, []);

  // Group employees by branch
  const branchMap = new Map<string, Employee[]>();
  employees.forEach(e => {
    const b = e.branch || "Chưa phân chi nhánh";
    if (!branchMap.has(b)) branchMap.set(b, []);
    branchMap.get(b)!.push(e);
  });
  const branchStats = Array.from(branchMap.entries()).map(([branch, emps]) => ({
    branch,
    total: emps.length,
    active: emps.filter(e => e.status === "active").length,
  }));

  return (
    <>
      <PageHeader title="Dashboard quản lý" subtitle="Tổng quan nhân sự toàn hệ thống" icon={Monitor} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng nhân sự" value={loading ? "..." : stats?.totalEmployees ?? 0} tone="blue" icon={Users} />
        <StatCard label="Có mặt hôm nay" value={loading ? "..." : stats?.activeToday ?? 0} tone="green" />
        <StatCard label="Nghỉ phép" value={loading ? "..." : stats?.onLeave ?? 0} tone="orange" icon={CheckSquare} />
        <StatCard label="Đi muộn" value={loading ? "..." : stats?.lateToday ?? 0} tone="purple" icon={Target} />
      </div>

      <Card title="Chi nhánh">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải dữ liệu...</p>
        ) : branchStats.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Chưa có dữ liệu chi nhánh.</p>
        ) : (
          <div className="space-y-3">
            {branchStats.map((b) => (
              <div key={b.branch} className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm">{b.branch}</p>
                  <p className="text-xs text-slate-500 mt-1">Đang làm: {b.active}/{b.total}</p>
                </div>
                <StatusBadge tone="green">{Math.round((b.active / Math.max(b.total, 1)) * 100)}%</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
