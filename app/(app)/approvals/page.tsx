"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { CheckSquare, Check, X } from "lucide-react";
import { hrData, ApprovalRequest } from "@/services/hr-data";
import { useState, useEffect } from "react";

const tabs = ["Chờ duyệt", "Đã duyệt", "Từ chối"];

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.approvals.list().then(data => {
      setRequests(data);
      setLoading(false);
    });
  }, []);

  const pendingCount = requests.filter(r => r.status === "Chờ duyệt").length;
  const approvedCount = requests.filter(r => r.status === "Đã duyệt").length;
  const rejectedCount = requests.filter(r => r.status === "Từ chối").length;

  return (
    <>
      <PageHeader title="Phê duyệt" subtitle="Trung tâm phê duyệt đơn từ" icon={CheckSquare} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Chờ duyệt" value={loading ? "-" : pendingCount.toString()} tone="orange" />
        <StatCard label="Đã duyệt" value={loading ? "-" : approvedCount.toString()} tone="green" />
        <StatCard label="Từ chối" value={loading ? "-" : rejectedCount.toString()} tone="red" />
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {tabs.map((tab, i) => (
          <button key={tab} className={`px-4 py-2 rounded-xl text-sm font-semibold ${i === 0 ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{tab}</button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải yêu cầu phê duyệt...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Không có đơn từ nào cần bạn phê duyệt.</p>
        ) : (
          requests.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white font-bold shrink-0">
                  {r.employee.split(" ").pop()?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.employee} · {r.code} · {r.date}</p>
                </div>
                <StatusBadge tone={r.type === "Nghỉ phép" ? "green" : r.type === "Chấm công" ? "blue" : r.type === "Tăng ca" ? "orange" : "purple"}>
                  {r.type}
                </StatusBadge>
                {r.status === "Chờ duyệt" ? (
                  <div className="flex gap-2">
                    <button className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center hover:bg-emerald-200"><Check size={16} /></button>
                    <button className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 grid place-items-center hover:bg-rose-200"><X size={16} /></button>
                  </div>
                ) : (
                  <StatusBadge tone={r.status === "Đã duyệt" ? "green" : "red"}>{r.status}</StatusBadge>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
