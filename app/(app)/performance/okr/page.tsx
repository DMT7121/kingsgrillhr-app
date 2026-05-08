"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Flag } from "lucide-react";
import { hrData, OkrObjective } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function OKRPage() {
  const [objectives, setObjectives] = useState<OkrObjective[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.performance.okrs().then(data => {
      setObjectives(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader title="Mục tiêu & OKR" subtitle="Objective & Key Results" icon={Flag} />
      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải OKR...</p>
        ) : objectives.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Bạn chưa có mục tiêu OKR nào.</p>
        ) : (
          objectives.map((o) => (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div><p className="font-bold text-slate-900">{o.title}</p><p className="text-xs text-slate-500">{o.quarter}</p></div>
                <span className="text-lg font-extrabold text-brand-700">{o.progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-4">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${o.progress}%` }} />
              </div>
              <div className="space-y-3">
                {o.krs.map((kr) => (
                  <div key={kr.title} className="p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-700">{kr.title}</p>
                      <span className="text-xs font-bold text-brand-600">{kr.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand-400" style={{ width: `${kr.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
