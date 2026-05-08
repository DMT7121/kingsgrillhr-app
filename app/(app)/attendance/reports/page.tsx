"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { BarChart3 } from "lucide-react";

const reportData = [
  { name: "Nguyễn Minh Anh", code: "NV001", daysWorked: 22, lateCount: 1, earlyLeave: 0, absent: 0, totalHours: "176h" },
  { name: "Trần Gia Hân", code: "NV002", daysWorked: 20, lateCount: 3, earlyLeave: 1, absent: 1, totalHours: "162h" },
  { name: "Lê Thuỳ Linh", code: "NV003", daysWorked: 21, lateCount: 0, earlyLeave: 0, absent: 1, totalHours: "168h" },
  { name: "Phạm Quốc Bảo", code: "NV004", daysWorked: 22, lateCount: 2, earlyLeave: 1, absent: 0, totalHours: "174h" },
];

export default function AttendanceReportsPage() {
  return (
    <>
      <PageHeader title="Báo cáo chấm công" subtitle="Thống kê hiện diện, trễ/sớm, tổng giờ" icon={BarChart3} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tỷ lệ hiện diện" value="96%" tone="green" />
        <StatCard label="Đúng giờ" value="92%" tone="blue" />
        <StatCard label="Đi muộn" value="4.2%" tone="orange" />
        <StatCard label="Vắng mặt" value="1.8%" tone="red" />
      </div>
      <Card title="Bảng công nhân viên — Tháng 5/2026">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Nhân viên</th>
              <th className="text-left px-5 py-3 font-semibold text-slate-500">Mã NV</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500">Ngày công</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500">Đi muộn</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500">Về sớm</th>
              <th className="text-center px-5 py-3 font-semibold text-slate-500">Vắng</th>
              <th className="text-right px-5 py-3 font-semibold text-slate-500">Tổng giờ</th>
            </tr></thead>
            <tbody>{reportData.map((r) => (
              <tr key={r.code} className="border-b border-slate-50">
                <td className="px-5 py-3 font-semibold text-slate-900">{r.name}</td>
                <td className="px-5 py-3 text-slate-500">{r.code}</td>
                <td className="px-5 py-3 text-center font-bold text-slate-900">{r.daysWorked}</td>
                <td className="px-5 py-3 text-center">{r.lateCount > 0 ? <StatusBadge tone="orange">{r.lateCount}</StatusBadge> : "0"}</td>
                <td className="px-5 py-3 text-center">{r.earlyLeave > 0 ? <StatusBadge tone="purple">{r.earlyLeave}</StatusBadge> : "0"}</td>
                <td className="px-5 py-3 text-center">{r.absent > 0 ? <StatusBadge tone="red">{r.absent}</StatusBadge> : "0"}</td>
                <td className="px-5 py-3 text-right font-bold text-brand-700">{r.totalHours}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
