"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { ArrowLeftRight, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface ShiftRequest {
  id: string;
  type: string;
  from?: string;
  to?: string;
  shift?: string;
  hours?: string;
  date: string;
  reason: string;
  status: string;
}

export default function ShiftRequestsPage() {
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !profile?.employee_id) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("shift_change_requests")
        .select("id, request_type, from_shift_id, to_shift_id, request_date, reason, status")
        .eq("employee_id", profile.employee_id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setRequests(data.map((r: any) => {
          let statusStr = "Chờ duyệt";
          if (r.status === "approved") statusStr = "Đã duyệt";
          if (r.status === "rejected") statusStr = "Từ chối";
          return {
            id: r.id,
            type: r.request_type === "overtime" ? "Tăng ca" : "Đổi ca",
            date: r.request_date ? new Date(r.request_date).toLocaleDateString("vi-VN") : "N/A",
            reason: r.reason || "",
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
      <PageHeader title="Đổi ca & Tăng ca" subtitle="Yêu cầu đổi ca, đăng ký tăng ca" icon={ArrowLeftRight}
        action={<button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Tạo yêu cầu</button>} />
      {loading ? (
        <p className="text-sm text-slate-500 py-4 text-center">Đang tải yêu cầu...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Bạn chưa có yêu cầu đổi ca/tăng ca nào.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge tone={r.type === "Đổi ca" ? "purple" : "blue"}>{r.type}</StatusBadge>
                    <span className="text-sm font-bold text-slate-900">{r.date}</span>
                  </div>
                  {r.reason && <p className="text-xs text-slate-400 mt-1">Lý do: {r.reason}</p>}
                </div>
                <StatusBadge tone={r.status === "Đã duyệt" ? "green" : r.status === "Từ chối" ? "red" : "orange"}>{r.status}</StatusBadge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
