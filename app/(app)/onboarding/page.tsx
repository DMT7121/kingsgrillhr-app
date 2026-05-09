"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Compass, CheckCircle2, Circle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: string;
}

export default function OnboardingPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured || !profile?.employee_id) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("onboarding_tasks")
        .select("id, title, description, is_completed, category")
        .eq("employee_id", profile.employee_id)
        .order("created_at");

      if (!error && data) {
        setTasks(data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || "",
          completed: t.is_completed || false,
          category: t.category || "Khác",
        })));
      }
      setLoading(false);
    }
    load();
  }, [profile?.employee_id]);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <>
      <PageHeader title="Hội nhập (Onboarding)" subtitle="Checklist hội nhập nhân viên mới" icon={Compass} />

      {/* Progress */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <p className="font-bold text-slate-900">Tiến trình hội nhập</p>
            <p className="text-xs text-slate-500 mt-1">{completedCount}/{tasks.length} công việc hoàn thành</p>
          </div>
          <span className="text-2xl font-extrabold text-brand-600">{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-500 py-4 text-center">Đang tải danh sách công việc...</p>
      ) : tasks.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Compass size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-semibold">Chưa có công việc hội nhập</p>
            <p className="text-xs text-slate-400 mt-1">Checklist sẽ được HR phân công khi bạn bắt đầu.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${t.completed ? "bg-emerald-50" : "hover:bg-slate-50"}`}>
                {t.completed ? (
                  <CheckCircle2 size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <Circle size={20} className="text-slate-300 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${t.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
                  {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                </div>
                <StatusBadge tone={t.completed ? "green" : "gray"}>{t.completed ? "Xong" : "Chưa"}</StatusBadge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
