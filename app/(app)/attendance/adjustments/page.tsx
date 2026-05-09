"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { PenLine, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface Adjustment {
  id: string;
  date: string;
  type: string;
  original: string;
  requested: string;
  reason: string;
  status: string;
}

export default function AttendanceAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !profile?.employee_id) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("attendance_adjustments")
        .select("id, work_date, adjustment_type, original_check_in, original_check_out, new_check_in, new_check_out, reason, status")
        .eq("employee_id", profile.employee_id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAdjustments(data.map((a: any) => {
          let statusStr = "Chờ duyệt";
          if (a.status === "approved") statusStr = "Đã duyệt";
          if (a.status === "rejected") statusStr = "Từ chối";

          const fmtTime = (t: string | null) => t ? t.slice(0, 5) : "—";

          return {
            id: a.id,
            date: a.work_date ? new Date(a.work_date).toLocaleDateString("vi-VN") : "N/A",
            type: a.adjustment_type || "Điều chỉnh",
            original: `${fmtTime(a.original_check_in)} - ${fmtTime(a.original_check_out)}`,
            requested: `${fmtTime(a.new_check_in)} - ${fmtTime(a.new_check_out)}`,
            reason: a.reason || "",
            status: statusStr,
          };
        }));
      }
      setLoading(false);
    }
    load();
  }, [profile?.employee_id]);

  return (
    <>
      <PageHeader title="Điều chỉnh chấm công" subtitle="Form điều chỉnh, lý do, minh chứng" icon={PenLine}
        action={<button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Tạo yêu cầu</button>} />
      <Card>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Ngày</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Loại</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Giờ gốc</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Yêu cầu</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Lý do</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Trạng thái</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-4 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
              ) : adjustments.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-4 text-center text-slate-500">Bạn chưa có yêu cầu điều chỉnh nào.</td></tr>
              ) : adjustments.map((a) => (
                <tr key={a.id} className="border-b border-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">{a.date}</td>
                  <td className="px-5 py-3 text-slate-600">{a.type}</td>
                  <td className="px-5 py-3 text-slate-500">{a.original}</td>
                  <td className="px-5 py-3 font-semibold text-brand-700">{a.requested}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-[180px] truncate">{a.reason}</td>
                  <td className="px-5 py-3"><StatusBadge tone={a.status === "Đã duyệt" ? "green" : a.status === "Chờ duyệt" ? "orange" : "red"}>{a.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
