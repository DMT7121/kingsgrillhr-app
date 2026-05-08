"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { hrData, Candidate } from "@/services/hr-data";
import { useState, useEffect } from "react";

const pipeline = [
  { stage: "CV mới", count: 18, color: "bg-blue-100 text-blue-700" },
  { stage: "Sơ loại", count: 12, color: "bg-violet-100 text-violet-700" },
  { stage: "Phỏng vấn", count: 6, color: "bg-orange-100 text-orange-700" },
  { stage: "Offer", count: 2, color: "bg-emerald-100 text-emerald-700" },
];

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.candidates.list().then(data => {
      setCandidates(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

  return (
    <>
      <PageHeader title="Tuyển dụng" subtitle="Quản lý tin tuyển dụng và ứng viên" icon={Briefcase} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Vị trí đang tuyển" value="5" tone="blue" icon={Briefcase} />
        <StatCard label="Ứng viên mới" value="18" tone="green" />
        <StatCard label="Phỏng vấn" value="6" tone="orange" />
        <StatCard label="Offer chờ duyệt" value="2" tone="purple" />
      </div>

      {/* Pipeline */}
      <Card title="Pipeline ứng viên" className="mb-6">
        <div className="grid grid-cols-4 gap-3">
          {pipeline.map((p) => (
            <div key={p.stage} className={`rounded-xl p-4 text-center ${p.color}`}>
              <p className="text-2xl font-extrabold">{p.count}</p>
              <p className="text-xs font-semibold mt-1">{p.stage}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Ứng viên gần đây">
        <div className="space-y-2">
          {candidates.slice(0, 8).map((c) => (
            <Link key={c.id} href={`/recruitment/candidates/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-brand-100 grid place-items-center text-brand-700 font-bold text-sm shrink-0">
                {c.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{c.name}</p>
                <p className="text-xs text-slate-500">{c.role}</p>
              </div>
              <StatusBadge tone={c.stage === "Offer" ? "green" : c.stage === "Phỏng vấn" ? "orange" : c.stage === "Sơ loại" ? "purple" : "blue"}>
                {c.stage}
              </StatusBadge>
              <span className="text-xs font-bold text-brand-600">{c.score}đ</span>
            </Link>
          ))}
        </div>
      </Card>
    </>
  );
}
