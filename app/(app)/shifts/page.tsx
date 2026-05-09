"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { CalendarDays } from "lucide-react";
import { hrData, Shift } from "@/services/hr-data";
import { useState, useEffect } from "react";

const weekDays = ["T2\n19/05", "T3\n20/05", "T4\n21/05", "T5\n22/05", "T6\n23/05", "T7\n24/05", "CN\n25/05"];

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.shifts.list().then(data => {
      setShifts(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader title="Lịch làm & Ca làm" subtitle="Quản lý ca làm việc và phân công" icon={CalendarDays} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Ca hôm nay" value="4" tone="blue" icon={CalendarDays} />
        <StatCard label="Tổng nhân sự" value="32" sub="người đi làm" tone="green" />
        <StatCard label="Yêu cầu đổi ca" value="3" sub="chờ duyệt" tone="orange" />
        <StatCard label="Tổng giờ công" value="256h" sub="tuần này" tone="purple" />
      </div>

      {/* Week Calendar */}
      <Card title="Lịch tuần này" className="mb-6">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {weekDays.map((day, i) => (
            <div key={i} className={`text-center p-3 rounded-xl text-xs ${i === 2 ? "bg-brand-600 text-white" : "bg-slate-50 text-slate-600"}`}>
              {day.split("\n").map((line, j) => (
                <p key={j} className={j === 0 ? "font-bold" : "mt-1 opacity-80"}>{line}</p>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Shift Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 col-span-2 text-center">Đang tải ca làm...</p>
        ) : shifts.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 col-span-2 text-center">Không có ca làm nào được cấu hình</p>
        ) : (
          shifts.map((shift) => (
            <Card key={shift.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{shift.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{shift.time}</p>
                </div>
                <StatusBadge tone={shift.status === "Đang diễn ra" ? "green" : shift.status === "Sắp tới" ? "blue" : shift.status === "Đã kết thúc" ? "gray" : "purple"}>
                  {shift.status}
                </StatusBadge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {Array.from({ length: Math.min(shift.employees, 4) }).map((_, i) => (
                    <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-indigo-500 border-2 border-white grid place-items-center text-[10px] text-white font-bold">
                      N{i + 1}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-slate-500">{shift.employees} nhân viên</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
