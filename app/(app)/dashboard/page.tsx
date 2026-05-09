"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { LayoutDashboard, Users, Clock, TreePalm, CalendarDays, Fingerprint, Wallet, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { label: "Chấm công", href: "/attendance", icon: Fingerprint, color: "bg-blue-100 text-blue-700" },
  { label: "Lịch làm", href: "/shifts", icon: CalendarDays, color: "bg-emerald-100 text-emerald-700" },
  { label: "Nghỉ phép", href: "/leave", icon: TreePalm, color: "bg-orange-100 text-orange-700" },
  { label: "Bảng lương", href: "/payroll", icon: Wallet, color: "bg-violet-100 text-violet-700" },
  { label: "Xem thêm", href: "/employees", icon: MoreHorizontal, color: "bg-slate-100 text-slate-600" },
];

const notifications = [
  { title: "Lịch đào tạo kỹ năng phục vụ tháng 5", sub: "Đào tạo vào ngày 28/05 lúc 14:00 tại phòng đào tạo tầng 2.", time: "1 giờ trước", tone: "blue" as const },
  { title: "Bảng lương tháng 5 đã được phát hành", sub: "Vui lòng kiểm tra chi tiết trong mục Bảng lương.", time: "3 giờ trước", tone: "green" as const },
  { title: "Cập nhật quy định đồng phục mùa hè", sub: "Áp dụng từ ngày 01/06. Xem chi tiết tại thông báo.", time: "5 giờ trước", tone: "orange" as const },
];

const attendanceWeek = [
  { day: "T2", present: 86, late: 5, absent: 4 },
  { day: "T3", present: 92, late: 8, absent: 2 },
  { day: "T4", present: 88, late: 7, absent: 5 },
  { day: "T5", present: 90, late: 6, absent: 4 },
  { day: "T6", present: 95, late: 4, absent: 1 },
  { day: "T7", present: 89, late: 7, absent: 4 },
  { day: "CN", present: 86, late: 7, absent: 5 },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Tổng quan"
        subtitle="Tổng quan hoạt động nhân sự nhà hàng"
        icon={LayoutDashboard}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Nhân sự đang làm" value="86" sub="/ 120 · ▲ 12% so với hôm qua" tone="blue" icon={Users} />
        <StatCard label="Đi muộn hôm nay" value="7" sub="người · ▲ 2 so với hôm qua" tone="orange" icon={Clock} />
        <StatCard label="Nghỉ phép" value="14" sub="người · ▼ 3 so với hôm qua" tone="green" icon={TreePalm} />
        <StatCard label="Ca sắp bắt đầu" value="3" sub="ca · Trong 60 phút tới" tone="purple" icon={CalendarDays} />
      </div>

      {/* Attendance Chart */}
      <Card title="Tình hình chấm công tuần này" className="mb-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-brand-500" /> Có mặt</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-rose-400 opacity-60" /> Đi muộn</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-6 rounded bg-slate-200" /> Vắng</span>
        </div>
        <div className="flex items-end gap-2 h-40 md:h-48">
          {attendanceWeek.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5">
                <div className="w-full rounded-t-lg bg-brand-500" style={{ height: `${d.present * 1.6}px` }} />
                <div className="w-full bg-rose-400/60" style={{ height: `${d.late * 3}px` }} />
                <div className="w-full rounded-b bg-slate-200" style={{ height: `${d.absent * 3}px` }} />
              </div>
              <span className="text-[10px] font-semibold text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Thao tác nhanh" className="mb-6">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <div className={`h-12 w-12 rounded-2xl grid place-items-center ${a.color}`}>
                <a.icon size={22} />
              </div>
              <span className="text-xs font-semibold text-slate-700 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Employee Highlight */}
        <Card title="Nhân viên nổi bật hôm nay" action={<Link href="/employees" className="text-xs font-bold text-brand-600">Xem tất cả</Link>}>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-lg font-bold shrink-0">
              TQ
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-slate-900">Trần Minh Quân</p>
              <p className="text-xs text-slate-500">Phục vụ</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <StatusBadge tone="blue">CSKH ★ 4.9/5</StatusBadge>
                <StatusBadge tone="green">Đúng giờ</StatusBadge>
                <StatusBadge tone="purple">Xuất sắc</StatusBadge>
              </div>
            </div>
          </div>
        </Card>

        {/* Shift Coverage */}
        <Card title="Tình hình phủ ca hiện tại">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" strokeWidth="8" strokeDasharray="251.3" strokeDashoffset="20" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-brand-700">92%</span>
                <span className="text-[10px] text-slate-500">Phủ ca</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                <span className="text-slate-600">Đã phủ</span>
                <span className="font-bold text-slate-900 ml-auto">22/24 ca</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Thiếu</span>
                <span className="font-bold text-slate-900 ml-auto">2/24 ca</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-600">Chưa mở</span>
                <span className="font-bold text-slate-900 ml-auto">3 ca</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <Card title="Thông báo nội bộ" action={<Link href="/notifications" className="text-xs font-bold text-brand-600">Xem tất cả</Link>}>
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                n.tone === "blue" ? "bg-blue-100 text-blue-600" :
                n.tone === "green" ? "bg-emerald-100 text-emerald-600" :
                "bg-orange-100 text-orange-600"
              }`}>
                <CalendarDays size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.sub}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400">{n.time}</span>
                <span className="h-2 w-2 rounded-full bg-brand-500" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
