"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Target } from "lucide-react";
import { hrData, KpiItem } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function KPIPage() {
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.performance.kpis().then(data => {
      setKpis(data);
      setLoading(false);
    });
  }, []);

  const totalScore = kpis.length > 0 ? Math.round(kpis.reduce((acc, k) => acc + k.score, 0) / kpis.length) : 0;
  const achieved = kpis.filter(k => k.score >= 100).length;
  const nearlyAchieved = kpis.filter(k => k.score >= 90 && k.score < 100).length;
  const failed = kpis.filter(k => k.score < 90).length;

  return (
    <>
      <PageHeader title="Hiệu suất KPI" subtitle="Chỉ số hiệu suất cá nhân" icon={Target} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Điểm tổng" value={loading ? "-" : totalScore.toString()} sub="/ 100" tone="blue" icon={Target} />
        <StatCard label="KPI đạt" value={loading ? "-" : `${achieved}/${kpis.length}`} tone="green" />
        <StatCard label="Gần đạt" value={loading ? "-" : nearlyAchieved.toString()} tone="orange" />
        <StatCard label="Chưa đạt" value={loading ? "-" : failed.toString()} tone="red" />
      </div>
      <Card title="Chi tiết KPI — Q2/2026">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải KPI...</p>
        ) : kpis.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Bạn chưa có mục tiêu KPI nào.</p>
        ) : (
          <div className="space-y-4">
            {kpis.map((k) => (
              <div key={k.id} className="p-4 rounded-xl bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="font-bold text-slate-900">{k.name}</p>
                  <StatusBadge tone={k.status === "Đạt" || k.status === "Xuất sắc" ? "green" : k.status === "Gần đạt" ? "orange" : "red"}>{k.status}</StatusBadge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                  <span>Mục tiêu: {k.target}</span><span>Thực tế: <strong className="text-slate-900">{k.actual}</strong></span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${k.score >= 100 ? "bg-emerald-500" : k.score >= 90 ? "bg-orange-400" : "bg-rose-500"}`} style={{ width: `${Math.min(k.score, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
