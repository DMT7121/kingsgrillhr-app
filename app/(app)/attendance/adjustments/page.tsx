"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { PenLine, Plus } from "lucide-react";

const adjustments = [
  { id: 1, date: "15/05/2026", type: "Quên chấm công", original: "—", requested: "08:05 - 17:10", reason: "Hệ thống lỗi", status: "Chờ duyệt" },
  { id: 2, date: "10/05/2026", type: "Sai giờ ra", original: "08:00 - 15:00", requested: "08:00 - 17:00", reason: "Quên checkout", status: "Đã duyệt" },
  { id: 3, date: "05/05/2026", type: "Đi muộn có lý do", original: "09:30 - 17:00", requested: "08:00 - 17:00", reason: "Tắc đường do mưa", status: "Từ chối" },
];

export default function AttendanceAdjustmentsPage() {
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
            <tbody>{adjustments.map((a) => (
              <tr key={a.id} className="border-b border-slate-50">
                <td className="px-5 py-3 font-semibold text-slate-900">{a.date}</td>
                <td className="px-5 py-3 text-slate-600">{a.type}</td>
                <td className="px-5 py-3 text-slate-500">{a.original}</td>
                <td className="px-5 py-3 font-semibold text-brand-700">{a.requested}</td>
                <td className="px-5 py-3 text-slate-500 max-w-[180px] truncate">{a.reason}</td>
                <td className="px-5 py-3"><StatusBadge tone={a.status === "Đã duyệt" ? "green" : a.status === "Chờ duyệt" ? "orange" : "red"}>{a.status}</StatusBadge></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
