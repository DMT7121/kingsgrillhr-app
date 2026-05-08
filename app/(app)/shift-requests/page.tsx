"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { ArrowLeftRight, Plus } from "lucide-react";

const requests = [
  { id: 1, type: "Đổi ca", from: "Ca sáng", to: "Ca chiều", date: "22/05/2026", reason: "Lịch cá nhân", status: "Chờ duyệt" },
  { id: 2, type: "Tăng ca", shift: "Ca chiều", hours: "3h", date: "20/05/2026", reason: "Hỗ trợ event", status: "Đã duyệt" },
  { id: 3, type: "Đổi ca", from: "Ca chiều", to: "Ca sáng", date: "18/05/2026", reason: "Đi khám bệnh chiều", status: "Đã duyệt" },
];

export default function ShiftRequestsPage() {
  return (
    <>
      <PageHeader title="Đổi ca & Tăng ca" subtitle="Yêu cầu đổi ca, đăng ký tăng ca" icon={ArrowLeftRight}
        action={<button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Tạo yêu cầu</button>} />
      <div className="space-y-3">
        {requests.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge tone={r.type === "Đổi ca" ? "purple" : "blue"}>{r.type}</StatusBadge>
                  <span className="text-sm font-bold text-slate-900">{r.date}</span>
                </div>
                <p className="text-sm text-slate-600">{r.type === "Đổi ca" ? `${r.from} → ${r.to}` : `${r.shift} · +${r.hours}`}</p>
                <p className="text-xs text-slate-400 mt-1">Lý do: {r.reason}</p>
              </div>
              <StatusBadge tone={r.status === "Đã duyệt" ? "green" : "orange"}>{r.status}</StatusBadge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
