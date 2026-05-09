"use client";

import PageHeader, { Card, StatusBadge } from "@/components/ui";

import { UserCircle, Briefcase, Clock, FileText, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";

const tabs = ["Tổng quan", "Công việc", "Chấm công", "Lương", "Tài liệu", "Đánh giá"];

export default function EmployeeDetailPage() {
  return (
    <>
      <PageHeader title="Chi tiết nhân viên" icon={UserCircle}
        action={<Link href="/employees" className="flex items-center gap-1 text-sm text-brand-600 font-semibold"><ArrowLeft size={16} /> Quay lại</Link>} />

      {/* Profile Card */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-2xl font-bold">MA</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">Nguyễn Minh Anh</h2>
            <p className="text-sm text-slate-500 mt-1">HR Manager · NV001</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge tone="green">Đang hoạt động</StatusBadge>
              <StatusBadge tone="blue">Nhân sự</StatusBadge>
              <StatusBadge tone="purple">Full-time</StatusBadge>
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
              ["Email", "minhanh@kingsgrill.vn"],
              ["Điện thoại", "0901 234 567"],
              ["Ngày sinh", "15/03/1995"],
              ["Giới tính", "Nữ"],
              ["Địa chỉ", "125 Nguyễn Huệ, Q.1, TP.HCM"],
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
              ["Phòng ban", "Nhân sự"],
              ["Chức danh", "HR Manager"],
              ["Quản lý trực tiếp", "Trần Văn Bình"],
              ["Chi nhánh", "Nhà hàng Hương Việt - Q.1"],
              ["Ngày vào làm", "01/06/2022"],
              ["Loại hợp đồng", "Chính thức"],
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
