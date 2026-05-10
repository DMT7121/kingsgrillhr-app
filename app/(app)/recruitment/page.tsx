"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Briefcase } from "lucide-react";
import Link from "next/link";
import { hrData, Candidate } from "@/services/hr-data";
import { useState, useEffect } from "react";

interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

export default function RecruitmentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);

  useEffect(() => {
    hrData.candidates.list().then(data => {
      setCandidates(data);

      // Compute pipeline from real data
      const stageMap: Record<string, number> = {};
      data.forEach(c => { stageMap[c.stage] = (stageMap[c.stage] || 0) + 1; });

      const colors: Record<string, string> = {
        "CV mới": "bg-blue-100 text-blue-700",
        "Sơ loại": "bg-violet-100 text-violet-700",
        "Phỏng vấn": "bg-orange-100 text-orange-700",
        "Offer": "bg-emerald-100 text-emerald-700",
        "Đã tuyển": "bg-green-100 text-green-700",
        "Từ chối": "bg-red-100 text-red-700",
      };

      const order = ["CV mới", "Sơ loại", "Phỏng vấn", "Offer", "Đã tuyển", "Từ chối"];
      const pipelineData = order
        .filter(s => stageMap[s])
        .map(s => ({ stage: s, count: stageMap[s], color: colors[s] || "bg-slate-100 text-slate-700" }));

      setPipeline(pipelineData);
      setLoading(false);
    });
  }, []);

  const interviewCount = candidates.filter(c => c.stage === "Phỏng vấn").length;
  const offerCount = candidates.filter(c => c.stage === "Offer").length;

  return (
    <>
      <PageHeader title="Tuyển dụng" subtitle="Quản lý tin tuyển dụng và ứng viên" icon={Briefcase} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Vị trí đang tuyển" value={loading ? "..." : pipeline.length} tone="blue" icon={Briefcase} />
        <StatCard label="Ứng viên" value={loading ? "..." : candidates.length} tone="green" />
        <StatCard label="Phỏng vấn" value={loading ? "..." : interviewCount} tone="orange" />
        <StatCard label="Offer chờ duyệt" value={loading ? "..." : offerCount} tone="purple" />
      </div>

      {/* Pipeline */}
      <Card title="Pipeline ứng viên" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            <p className="col-span-4 text-sm text-slate-500 py-4 text-center">Đang tải...</p>
          ) : pipeline.length === 0 ? (
            <p className="col-span-4 text-sm text-slate-500 py-4 text-center">Chưa có dữ liệu tuyển dụng</p>
          ) : (
            pipeline.map((p) => (
              <div key={p.stage} className={`rounded-xl p-4 text-center ${p.color}`}>
                <p className="text-2xl font-extrabold">{p.count}</p>
                <p className="text-xs font-semibold mt-1">{p.stage}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Ứng viên gần đây">
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Đang tải...</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Chưa có ứng viên nào</p>
          ) : (
            candidates.slice(0, 8).map((c) => (
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
            ))
          )}
        </div>
      </Card>
    </>
  );
}
