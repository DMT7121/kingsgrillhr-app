"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { BarChart3 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface ReportRow {
  name: string;
  code: string;
  daysWorked: number;
  lateCount: number;
  earlyLeave: number;
  absent: number;
  totalHours: string;
}

export default function AttendanceReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ present: 0, late: 0, absent: 0 });

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) { setLoading(false); return; }

      // Get all attendance records for this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          id, work_date, status, check_in, check_out, work_hours,
          employees:employee_id(full_name, employee_code)
        `)
        .gte("work_date", startOfMonth)
        .lte("work_date", endOfMonth);

      if (error || !data) { setLoading(false); return; }

      // Group by employee
      const empMap = new Map<string, { name: string; code: string; days: number; late: number; hours: number }>();
      let totalPresent = 0, totalLate = 0;

      data.forEach((r: any) => {
        const emp = r.employees;
        if (!emp) return;
        const key = emp.employee_code;
        if (!empMap.has(key)) empMap.set(key, { name: emp.full_name, code: emp.employee_code, days: 0, late: 0, hours: 0 });
        const entry = empMap.get(key)!;
        entry.days++;
        totalPresent++;
        if (r.status === "late") { entry.late++; totalLate++; }
        entry.hours += Number(r.work_hours) || 8;
      });

      setTotals({ present: totalPresent, late: totalLate, absent: 0 });
      setRows(Array.from(empMap.values()).map(e => ({
        name: e.name, code: e.code, daysWorked: e.days, lateCount: e.late,
        earlyLeave: 0, absent: 0, totalHours: `${Math.round(e.hours)}h`,
      })));
      setLoading(false);
    }
    load();
  }, []);

  const totalRows = rows.length || 1;
  const presentRate = totals.present > 0 ? Math.round((totals.present / (totalRows * 22)) * 100) : 0;
  const lateRate = totals.late > 0 ? ((totals.late / Math.max(totals.present, 1)) * 100).toFixed(1) : "0";

  return (
    <>
      <PageHeader title="Báo cáo chấm công" subtitle="Thống kê hiện diện, trễ/sớm, tổng giờ" icon={BarChart3} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng bản ghi" value={loading ? "..." : totals.present} tone="green" />
        <StatCard label="Nhân viên" value={loading ? "..." : rows.length} tone="blue" />
        <StatCard label="Đi muộn" value={loading ? "..." : `${lateRate}%`} tone="orange" />
        <StatCard label="Trung bình giờ" value={loading ? "..." : rows.length > 0 ? `${Math.round(rows.reduce((a, r) => a + parseInt(r.totalHours), 0) / rows.length)}h` : "0h"} tone="purple" />
      </div>
      <Card title={`Bảng công nhân viên — Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`}>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Nhân viên</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Mã NV</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500">Ngày công</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500">Đi muộn</th>
              <th className="text-right px-5 py-3 font-semibold text-slate-500">Tổng giờ</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-4 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-4 text-center text-slate-500">Chưa có dữ liệu chấm công tháng này.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.code} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-5 py-3 text-slate-500">{r.code}</td>
                  <td className="px-5 py-3 text-center font-bold text-slate-900">{r.daysWorked}</td>
                  <td className="px-5 py-3 text-center">{r.lateCount > 0 ? <StatusBadge tone="orange">{r.lateCount}</StatusBadge> : "0"}</td>
                  <td className="px-5 py-3 text-right font-bold text-brand-700">{r.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
