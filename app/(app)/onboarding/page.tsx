"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { UserPlus, CheckCircle, Circle } from "lucide-react";
const tasks = [
  { task: "Nộp hồ sơ cá nhân", assignee: "HR Team", done: true },
  { task: "Ký hợp đồng lao động", assignee: "HR Team", done: true },
  { task: "Nhận đồng phục & thẻ nhân viên", assignee: "Admin", done: true },
  { task: "Tour chi nhánh", assignee: "Mentor", done: false },
  { task: "Đào tạo an toàn lao động", assignee: "Mentor", done: false },
  { task: "Đào tạo quy trình làm việc", assignee: "Trưởng nhóm", done: false },
  { task: "Đánh giá thử việc tuần 1", assignee: "Quản lý", done: false },
];
export default function OnboardingPage() {
  return (
    <>
      <PageHeader title="Hội nhập / Onboarding" subtitle="Checklist nhiệm vụ onboarding nhân viên mới" icon={UserPlus} />
      <Card title="Checklist Onboarding — Nguyễn Văn Hùng (NV150)">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-slate-600">Tiến độ</span>
            <span className="text-sm font-bold text-brand-700">3/7 hoàn thành</span>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-brand-500" style={{ width: "43%" }} />
          </div>
        </div>
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.task} className={`flex items-center gap-3 p-3 rounded-xl ${t.done ? "bg-emerald-50" : "bg-slate-50"}`}>
              {t.done ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <Circle size={18} className="text-slate-300 shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${t.done ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.task}</p>
                <p className="text-xs text-slate-400">Phụ trách: {t.assignee}</p>
              </div>
              <StatusBadge tone={t.done ? "green" : "gray"}>{t.done ? "Hoàn thành" : "Chưa làm"}</StatusBadge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
