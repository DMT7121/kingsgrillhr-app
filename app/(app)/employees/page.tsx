"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Users, Search, Filter } from "lucide-react";
import Link from "next/link";
import { hrData, Employee } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.employees.list().then(data => {
      setEmployees(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;

  return (
    <>
      <PageHeader title="Danh sách nhân viên" subtitle="Quản lý thông tin nhân sự" icon={Users}
        action={<button className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ Thêm nhân viên</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng nhân sự" value={employees.length} tone="blue" icon={Users} />
        <StatCard label="Đang làm" value={employees.filter(e => e.status === "active").length} tone="green" />
        <StatCard label="Nghỉ phép" value={employees.filter(e => e.status === "on_leave").length} tone="orange" />
        <StatCard label="Khác" value={employees.filter(e => !["active", "on_leave"].includes(e.status)).length} tone="purple" />
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input className="bg-transparent text-sm outline-none w-full" placeholder="Tìm theo tên, mã NV..." />
          </div>
          <select className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600 outline-none">
            <option>Tất cả phòng ban</option>
            <option>Vận hành</option><option>Nhân sự</option><option>Kế toán</option>
            <option>Kinh doanh</option><option>Bếp</option><option>Dịch vụ</option>
          </select>
          <button className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">
            <Filter size={16} /> Bộ lọc
          </button>
        </div>
      </Card>

      {/* Employee Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.slice(0, 12).map((emp) => (
          <Link key={emp.id} href={`/employees/${emp.id}`} className="block">
            <Card className="hover:shadow-soft transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} alt={emp.full_name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white font-bold shrink-0">
                    {emp.full_name.split(" ").pop()?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">{emp.full_name}</p>
                  <p className="text-xs text-slate-500">{emp.employee_code} · {emp.position}</p>
                </div>
                <StatusBadge tone={emp.status === "active" ? "green" : emp.status === "on_leave" ? "orange" : "purple"}>
                  {emp.status === "active" ? "Đang làm" : emp.status === "on_leave" ? "Nghỉ phép" : emp.status}
                </StatusBadge>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-4 text-xs text-slate-500">
                <span>{emp.department || "Chưa có phòng ban"}</span>
                <span>{emp.phone || "Chưa cập nhật SĐT"}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
