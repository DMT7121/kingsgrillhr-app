"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { ArrowLeftRight, Plus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface ShiftRequest {
  id: string;
  type: "shift_change" | "overtime";
  from_shift: string | null;
  to_shift: string | null;
  hours: number | null;
  date: string;
  reason: string;
  status: string;
}

const mockRequests: ShiftRequest[] = [
  { id: "1", type: "shift_change", from_shift: "Ca sáng", to_shift: "Ca chiều", hours: null, date: "22/05/2026", reason: "Lịch cá nhân", status: "pending" },
  { id: "2", type: "overtime", from_shift: null, to_shift: null, hours: 3, date: "20/05/2026", reason: "Hỗ trợ event", status: "approved" },
  { id: "3", type: "shift_change", from_shift: "Ca chiều", to_shift: "Ca sáng", hours: null, date: "18/05/2026", reason: "Đi khám bệnh chiều", status: "approved" },
];

export default function ShiftRequestsPage() {
  const { profile } = useAuthStore();
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.employee_id) {
      setRequests(mockRequests);
      setLoading(false);
      return;
    }

    const empId = profile.employee_id;

    (async () => {
      // Load shift change requests
      const { data: scReqs } = await supabase
        .from("shift_change_requests")
        .select(`
          id, work_date, reason, status,
          from_shift:from_shift_id(name),
          to_shift:to_shift_id(name)
        `)
        .eq("employee_id", empId)
        .order("created_at", { ascending: false });

      // Load overtime requests
      const { data: otReqs } = await supabase
        .from("overtime_requests")
        .select("id, work_date, hours, reason, status")
        .eq("employee_id", empId)
        .order("created_at", { ascending: false });

      const combined: ShiftRequest[] = [];

      scReqs?.forEach((r: any) => {
        combined.push({
          id: r.id,
          type: "shift_change",
          from_shift: r.from_shift?.name || null,
          to_shift: r.to_shift?.name || null,
          hours: null,
          date: new Date(r.work_date).toLocaleDateString("vi-VN"),
          reason: r.reason || "",
          status: r.status,
        });
      });

      otReqs?.forEach((r: any) => {
        combined.push({
          id: r.id,
          type: "overtime",
          from_shift: null,
          to_shift: null,
          hours: Number(r.hours),
          date: new Date(r.work_date).toLocaleDateString("vi-VN"),
          reason: r.reason || "",
          status: r.status,
        });
      });

      setRequests(combined);
      setLoading(false);
    })();
  }, [profile?.employee_id]);

  const statusLabel = (s: string) => {
    if (s === "approved") return "Đã duyệt";
    if (s === "rejected") return "Từ chối";
    return "Chờ duyệt";
  };
  const statusTone = (s: string) => (s === "approved" ? "green" : s === "rejected" ? "red" : "orange");

  return (
    <>
      <PageHeader title="Đổi ca & Tăng ca" subtitle="Yêu cầu đổi ca, đăng ký tăng ca" icon={ArrowLeftRight}
        action={<button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Tạo yêu cầu</button>} />
      
      {loading ? (
        <Card><div className="flex items-center justify-center gap-2 py-8 text-slate-500"><Loader2 size={20} className="animate-spin" /> Đang tải...</div></Card>
      ) : requests.length === 0 ? (
        <Card><p className="text-sm text-slate-500 py-8 text-center">Chưa có yêu cầu nào.</p></Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge tone={r.type === "shift_change" ? "purple" : "blue"}>{r.type === "shift_change" ? "Đổi ca" : "Tăng ca"}</StatusBadge>
                    <span className="text-sm font-bold text-slate-900">{r.date}</span>
                  </div>
                  <p className="text-sm text-slate-600">{r.type === "shift_change" ? `${r.from_shift || "?"} → ${r.to_shift || "?"}` : `+${r.hours}h`}</p>
                  <p className="text-xs text-slate-400 mt-1">Lý do: {r.reason}</p>
                </div>
                <StatusBadge tone={statusTone(r.status)}>{statusLabel(r.status)}</StatusBadge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
