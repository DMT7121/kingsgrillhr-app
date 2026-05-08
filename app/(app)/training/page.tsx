"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { GraduationCap } from "lucide-react";
import { hrData, TrainingCourse } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function TrainingPage() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.training.list().then(data => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const completed = courses.filter(c => c.status === "Hoàn thành").length;
  const inProgress = courses.filter(c => c.status === "Đang học").length;
  const notStarted = courses.filter(c => c.status === "Chưa bắt đầu").length;

  return (
    <>
      <PageHeader title="Đào tạo" subtitle="Khóa học, tiến độ, chứng chỉ" icon={GraduationCap} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng khóa học" value={loading ? "-" : courses.length.toString()} tone="blue" />
        <StatCard label="Hoàn thành" value={loading ? "-" : completed.toString()} tone="green" />
        <StatCard label="Đang học" value={loading ? "-" : inProgress.toString()} tone="orange" />
        <StatCard label="Chưa bắt đầu" value={loading ? "-" : notStarted.toString()} tone="gray" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center col-span-2">Đang tải khóa học...</p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center col-span-2">Bạn chưa được phân công khóa học nào.</p>
        ) : (
          courses.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between mb-3">
                <p className="font-bold text-slate-900">{c.title}</p>
                <StatusBadge tone={c.status === "Hoàn thành" ? "green" : c.status === "Đang học" ? "blue" : "gray"}>{c.status}</StatusBadge>
              </div>
              <p className="text-xs text-slate-500 mb-3">Hạn: {c.deadline}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.progress === 100 ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${c.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{c.progress}%</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
