"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Monitor, Users, CheckSquare, Target, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { hrData, DashboardStats } from "@/services/hr-data";

interface BranchStat {
  name: string;
  present: number;
  total: number;
}

export default function ManagerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [branches, setBranches] = useState<BranchStat[]>([]);
  const [weekData, setWeekData] = useState<number[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const s = await hrData.dashboard.stats();
      setStats(s);

      if (isSupabaseConfigured) {
        // Load branch stats
        const { data: branchList } = await supabase
          .from("branches")
          .select("id, name")
          .eq("is_deleted", false);

        if (branchList) {
          const today = new Date().toISOString().slice(0, 10);
          const bStats: BranchStat[] = [];
          for (const br of branchList) {
            const { count: total } = await supabase
              .from("employees")
              .select("id", { count: "exact", head: true })
              .eq("branch_id", br.id)
              .eq("is_deleted", false);

            const { count: present } = await supabase
              .from("attendance_records")
              .select("id", { count: "exact", head: true })
              .eq("work_date", today)
              .in("employee_id", 
                (await supabase.from("employees").select("id").eq("branch_id", br.id).eq("is_deleted", false)).data?.map((e: any) => e.id) || []
              );

            bStats.push({ name: br.name, present: present ?? 0, total: total ?? 0 });
          }
          setBranches(bStats);
        }

        // Load 7-day attendance rates
        const today = new Date();
        const rates: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);

          const { count: present } = await supabase
            .from("attendance_records")
            .select("id", { count: "exact", head: true })
            .eq("work_date", dateStr);

          const totalEmp = s.totalEmployees || 1;
          rates.push(Math.round(((present ?? 0) / totalEmp) * 100));
        }
        setWeekData(rates);

        // Pending approvals count
        const { count: pending } = await supabase
          .from("approval_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        setPendingApprovals(pending ?? 0);
      } else {
        setBranches([
          { name: "King's Grill - Q.1", present: 42, total: 48 },
          { name: "King's Grill - Q.7", present: 28, total: 32 },
          { name: "King's Grill - Thủ Đức", present: 22, total: 25 },
        ]);
        setWeekData([92, 94, 90, 91, 92, 95, 93]);
        setPendingApprovals(8);
      }

      setLoading(false);
    })();
  }, []);

  const avgKpi = stats ? (stats.totalEmployees > 0 ? Math.round((stats.activeToday / stats.totalEmployees) * 100) : 0) : 0;

  return (
    <>
      <PageHeader title="Dashboard quản lý" subtitle="Tổng quan hoạt động nhà hàng" icon={Monitor} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng nhân sự" value={loading ? "..." : stats?.totalEmployees ?? 0} tone="blue" icon={Users} />
        <StatCard label="Hiện diện" value={loading ? "..." : stats?.activeToday ?? 0} sub={`/ ${stats?.totalEmployees ?? 0} hôm nay`} tone="green" />
        <StatCard label="Đơn chờ duyệt" value={loading ? "..." : pendingApprovals} tone="orange" icon={CheckSquare} />
        <StatCard label="Tỷ lệ hiện diện" value={loading ? "..." : `${avgKpi}%`} tone="purple" icon={Target} />
      </div>

      <Card title="Tỷ lệ hiện diện 7 ngày" className="mb-6">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {weekData.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-brand-600">{v}%</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${Math.max(v * 1.4, 5)}px` }} />
                <span className="text-[10px] text-slate-400">{["T2","T3","T4","T5","T6","T7","CN"][i]}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Chi nhánh">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
        ) : branches.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Chưa có chi nhánh nào.</p>
        ) : (
          <div className="space-y-3">
            {branches.map((b) => {
              const rate = b.total > 0 ? Math.round((b.present / b.total) * 100) : 0;
              return (
                <div key={b.name} className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm">{b.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Hiện diện: {b.present}/{b.total}</p>
                  </div>
                  <StatusBadge tone={rate >= 90 ? "green" : rate >= 75 ? "orange" : "red"}>{rate}%</StatusBadge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}
