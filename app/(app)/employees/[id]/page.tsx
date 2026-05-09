"use client";

import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { UserCircle, Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { hrData, Employee } from "@/services/hr-data";
import { useState, useEffect } from "react";

const tabs = ["Tổng quan", "Công việc", "Chấm công", "Lương", "Tài liệu", "Đánh giá"];

export default function EmployeeDetailPage() {
  const params = useParams();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id as string;
    if (id) {
      hrData.employees.getById(id).then((data) => {
        setEmp(data);
        setLoading(false);
      });
    }
  }, [params?.id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  if (!emp) return <div className="p-8 text-center text-slate-500">Không tìm thấy nhân viên</div>;

  const initials = emp.full_name.split(" ").pop()?.slice(0, 2).toUpperCase() || "NV";

  return (
    <>
      <PageHeader title="Chi tiết nhân viên" icon={UserCircle}
        action={<Link href="/employees" className="flex items-center gap-1 text-sm text-brand-600 font-semibold"><ArrowLeft size={16} /> Quay lại</Link>} />

      {/* Profile Card */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt={emp.full_name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-2xl font-bold">{initials}</div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{emp.full_name}</h2>
            <p className="text-sm text-slate-500 mt-1">{emp.position || "Chưa cập nhật"} · {emp.employee_code}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge tone={emp.status === "active" ? "green" : emp.status === "on_leave" ? "orange" : "gray"}>
                {emp.status === "active" ? "Đang hoạt động" : emp.status === "on_leave" ? "Nghỉ phép" : emp.status}
              </StatusBadge>
              {emp.department && <StatusBadge tone="blue">{emp.department}</StatusBadge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 pb-1">
        {tabs.map((tab, i) => (
          <button key={tab} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            i === 0 ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}>{tab}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Thông tin cá nhân">
          <div className="space-y-3">
            {[
              ["Email", emp.email || "Chưa cập nhật"],
              ["Điện thoại", emp.phone || "Chưa cập nhật"],
              ["Ngày vào làm", emp.hire_date ? new Date(emp.hire_date).toLocaleDateString("vi-VN") : "Chưa cập nhật"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Thông tin công việc">
          <div className="space-y-3">
            {[
              ["Phòng ban", emp.department || "Chưa cập nhật"],
              ["Chức danh", emp.position || "Chưa cập nhật"],
              ["Chi nhánh", emp.branch || "Chưa cập nhật"],
              ["Mã NV", emp.employee_code],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
