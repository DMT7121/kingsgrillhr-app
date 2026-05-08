"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { UserSearch, ArrowLeft } from "lucide-react";
import Link from "next/link";
export default function CandidateDetailPage() {
  return (
    <>
      <PageHeader title="Chi tiết ứng viên" icon={UserSearch}
        action={<Link href="/recruitment" className="flex items-center gap-1 text-sm text-brand-600 font-semibold"><ArrowLeft size={16} /> Quay lại</Link>} />
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 grid place-items-center text-white text-2xl font-bold">LA</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">Lan Anh</h2>
            <p className="text-sm text-slate-500">Ứng tuyển: Nhân viên phục vụ</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge tone="orange">Phỏng vấn</StatusBadge>
              <StatusBadge tone="blue">Score: 85</StatusBadge>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Thông tin ứng viên">
          <div className="space-y-3">
            {[["Email", "lananh@email.com"], ["Điện thoại", "0912 345 678"], ["Nguồn", "Facebook"], ["Kinh nghiệm", "2 năm F&B"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Lịch phỏng vấn">
          <div className="p-4 rounded-xl bg-brand-50">
            <p className="font-bold text-brand-700">Vòng 2 — Phỏng vấn chuyên môn</p>
            <p className="text-sm text-slate-600 mt-1">25/05/2026 · 14:00 · Phòng họp A</p>
            <p className="text-xs text-slate-500 mt-1">Người PV: Võ Đức Huy (Bếp trưởng)</p>
          </div>
        </Card>
      </div>
    </>
  );
}
