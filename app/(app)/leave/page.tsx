"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { TreePalm, Plus } from "lucide-react";
import { hrData, LeaveRequest } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.leaves.list().then(data => {
      setLeaveRequests(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader title="Nghỉ phép / Đơn từ" subtitle="Quản lý đơn nghỉ phép và đơn từ" icon={TreePalm}
        action={<button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"><Plus size={16} /> Tạo đơn mới</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Phép năm" value="12" sub="ngày / năm" tone="blue" />
        <StatCard label="Đã sử dụng" value="4" sub="ngày" tone="orange" />
        <StatCard label="Còn lại" value="8" sub="ngày" tone="green" />
        <StatCard label="Chờ duyệt" value="1" sub="đơn" tone="purple" />
      </div>

      <Card title="Danh sách đơn nghỉ phép">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Loại</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Từ ngày</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Đến ngày</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Số ngày</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Lý do</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-500">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-4 text-center text-sm text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-4 text-center text-sm text-slate-500">Bạn chưa có đơn từ nào</td>
                </tr>
              ) : (
                leaveRequests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900">{r.type}</td>
                    <td className="px-5 py-3 text-slate-600">{r.from}</td>
                    <td className="px-5 py-3 text-slate-600">{r.to}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">{r.days}</td>
                    <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={r.status === "Đã duyệt" ? "green" : r.status === "Chờ duyệt" ? "orange" : "red"}>
                        {r.status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
