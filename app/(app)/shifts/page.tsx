"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { CalendarDays } from "lucide-react";
import { hrData, Shift } from "@/services/hr-data";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalShifts: 0, totalStaff: 0, pendingRequests: 0, totalHours: "0h" });
  const [weekDays, setWeekDays] = useState<string[]>([]);

  useEffect(() => {
    // Build dynamic week dates
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=CN, 1=T2...
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(`${labels[i]}\n${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`);
    }
    setWeekDays(days);

    // Load shifts from service
    hrData.shifts.list().then(async (data) => {
      setShifts(data);

      if (isSupabaseConfigured) {
        const todayStr = new Date().toISOString().slice(0, 10);

        // Count attendance today = total staff working
        const { count: staffToday } = await supabase
          .from("attendance_records")
          .select("id", { count: "exact", head: true })
          .eq("work_date", todayStr);

        // Pending shift change requests
        const { count: pending } = await supabase
          .from("shift_change_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");

        // Total weekly hours (approx: attendance records this week * avg 8h)
        const startOfWeek = new Date(monday).toISOString().slice(0, 10);
        const endOfWeek = new Date(monday);
        endOfWeek.setDate(monday.getDate() + 6);
        const endStr = endOfWeek.toISOString().slice(0, 10);

        const { data: weekRecords } = await supabase
          .from("attendance_records")
          .select("work_hours")
          .gte("work_date", startOfWeek)
          .lte("work_date", endStr);

        const totalHrs = weekRecords?.reduce((s: number, r: any) => s + (Number(r.work_hours) || 8), 0) || 0;

        setStats({
          totalShifts: data.length,
          totalStaff: staffToday ?? 0,
          pendingRequests: pending ?? 0,
          totalHours: `${Math.round(totalHrs)}h`,
        });
      } else {
        setStats({ totalShifts: data.length, totalStaff: 32, pendingRequests: 3, totalHours: "256h" });
      }
      setLoading(false);
    });
  }, []);

  const todayIdx = (() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // Convert Sun=0 → 6, Mon=1 → 0, etc.
  })();

  return (
    <>
      <PageHeader title="Lịch làm & Ca làm" subtitle="Quản lý ca làm việc và phân công" icon={CalendarDays} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Ca hôm nay" value={loading ? "..." : stats.totalShifts} tone="blue" icon={CalendarDays} />
        <StatCard label="Nhân sự đi làm" value={loading ? "..." : stats.totalStaff} sub="người hôm nay" tone="green" />
        <StatCard label="Yêu cầu đổi ca" value={loading ? "..." : stats.pendingRequests} sub="chờ duyệt" tone="orange" />
        <StatCard label="Tổng giờ công" value={loading ? "..." : stats.totalHours} sub="tuần này" tone="purple" />
      </div>

      {/* Week Calendar */}
      <Card title="Lịch tuần này" className="mb-6">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {weekDays.map((day, i) => (
            <div key={i} className={`text-center p-3 rounded-xl text-xs ${i === todayIdx ? "bg-brand-600 text-white" : "bg-slate-50 text-slate-600"}`}>
              {day.split("\n").map((line, j) => (
                <p key={j} className={j === 0 ? "font-bold" : "mt-1 opacity-80"}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Shift Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 col-span-2 text-center">Đang tải ca làm...</p>
        ) : shifts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 col-span-2 text-center">Không có ca làm nào được cấu hình</p>
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{shift.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{shift.time}</p>
                </div>
                <StatusBadge tone={shift.status === "Đang diễn ra" ? "green" : shift.status === "Sắp tới" ? "blue" : shift.status === "Đã kết thúc" ? "gray" : "purple"}>
                  {shift.status}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(shift.employees, 4) }).map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 border-2 border-white grid place-items-center text-[10px] text-white font-bold">
                      N{i + 1}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-slate-500">{shift.employees} nhân viên</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
