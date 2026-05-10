"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { LayoutDashboard, Users, Clock, TreePalm, CalendarDays, Fingerprint, Wallet, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { hrData, DashboardStats, AppNotification } from "@/services/hr-data";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const quickActions = [
  { label: "Chấm công", href: "/attendance", icon: Fingerprint, color: "bg-blue-100 text-blue-700" },
  { label: "Lịch làm", href: "/shifts", icon: CalendarDays, color: "bg-emerald-100 text-emerald-700" },
  { label: "Nghỉ phép", href: "/leave", icon: TreePalm, color: "bg-orange-100 text-orange-700" },
  { label: "Bảng lương", href: "/payroll", icon: Wallet, color: "bg-violet-100 text-violet-700" },
  { label: "Xem thêm", href: "/employees", icon: MoreHorizontal, color: "bg-slate-100 text-slate-600" },
];

interface WeekDay {
  day: string;
  present: number;
  late: number;
  absent: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [attendanceWeek, setAttendanceWeek] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [s, n] = await Promise.all([
        hrData.dashboard.stats(),
        hrData.notifications.list(),
      ]);
      setStats(s);
      setNotifications(n.slice(0, 3));

      // Load weekly attendance chart data from Supabase
      if (isSupabaseConfigured) {
        const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        const today = new Date();
        const weekData: WeekDay[] = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const dayLabel = dayLabels[d.getDay()];

          const { count: present } = await supabase
            .from("attendance_records")
            .select("id", { count: "exact", head: true })
            .eq("work_date", dateStr);

          const { count: late } = await supabase
            .from("attendance_records")
            .select("id", { count: "exact", head: true })
            .eq("work_date", dateStr)
            .eq("status", "late");

          const totalEmp = stats?.totalEmployees || 0;
          weekData.push({
            day: dayLabel,
            present: (present ?? 0) - (late ?? 0),
            late: late ?? 0,
            absent: Math.max(0, totalEmp - (present ?? 0)),
          });
        }
        setAttendanceWeek(weekData);
      } else {
        setAttendanceWeek([
          { day: "T2", present: 86, late: 5, absent: 4 },
          { day: "T3", present: 92, late: 8, absent: 2 },
          { day: "T4", present: 88, late: 7, absent: 5 },
          { day: "T5", present: 90, late: 6, absent: 4 },
          { day: "T6", present: 95, late: 4, absent: 1 },
          { day: "T7", present: 89, late: 7, absent: 4 },
          { day: "CN", present: 86, late: 7, absent: 5 },
        ]);
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const maxBar = Math.max(...attendanceWeek.map(d => d.present + d.late + d.absent), 1);

  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle="Tổng quan hoạt động nhân sự nhà hàng"
        icon={LayoutDashboard}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Tổng nhân sự" value={loading ? "..." : stats?.totalEmployees ?? 0} tone="blue" icon={Users} />
        <StatCard label="Đi muộn hôm nay" value={loading ? "..." : stats?.lateToday ?? 0} sub="người" tone="orange" icon={Clock} />
        <StatCard label="Nghỉ phép" value={loading ? "..." : stats?.onLeave ?? 0} sub="người" tone="green" icon={TreePalm} />
        <StatCard label="Có mặt hôm nay" value={loading ? "..." : stats?.activeToday ?? 0} sub="người" tone="purple" icon={CalendarDays} />
      </div>

      {/* Attendance Chart */}
      {attendanceWeek.length > 0 && (
        <Card title="Tình hình chấm công tuần này" className="mb-6">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-brand-500" /> Có mặt</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-rose-400 opacity-60" /> Đi muộn</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-slate-200" /> Vắng</span>
          </div>
          <div className="flex items-end gap-2 h-40 md:h-48">
            {attendanceWeek.map((d) => {
              const total = d.present + d.late + d.absent;
              const scale = maxBar > 0 ? 160 / maxBar : 1;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5">
                    <div className="w-full rounded-t-lg bg-brand-500" style={{ height: `${d.present * scale}px` }} />
                    <div className="w-full bg-rose-400/60" style={{ height: `${d.late * scale}px` }} />
                    <div className="w-full rounded-b bg-slate-200" style={{ height: `${d.absent * scale}px` }} />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{d.day}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card title="Thao tác nhanh" className="mb-6">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <div className={`h-12 w-12 rounded-2xl grid place-items-center ${a.color}`}>
                <a.icon size={22} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Thông báo gần đây" action={<Link href="/notifications" className="text-xs font-bold text-brand-600">Xem tất cả</Link>}>
        {loading ? (
          <p className="text-sm text-slate-500 py-2">Đang tải...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Không có thông báo nào.</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                  n.type === "success" ? "bg-emerald-100 text-emerald-600" :
                  n.type === "warning" ? "bg-orange-100 text-orange-600" :
                  n.type === "payroll" ? "bg-violet-100 text-violet-600" :
                  "bg-blue-100 text-blue-600"
                }`}>
                  <CalendarDays size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400">{n.time}</span>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
