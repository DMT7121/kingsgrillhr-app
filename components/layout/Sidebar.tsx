"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore, AppRole } from "@/store/useAuthStore";
import {
  LayoutDashboard, Monitor, Fingerprint, CalendarDays, BarChart3,
  ArrowLeftRight, PenLine, Users, UserCircle, Network, FileText,
  TreePalm, CheckSquare, Wallet, Gift, Target, Star, Flag,
  GraduationCap, UserPlus, Bell, MessageCircle, AlertTriangle,
  ScrollText, Settings, Briefcase, UserSearch, X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: any;
  roles?: AppRole[];
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Dashboard quản lý", href: "/manager-dashboard", icon: Monitor, roles: ["manager", "hr", "admin", "super_admin"] },
    ],
  },
  {
    label: "CHẤM CÔNG",
    items: [
      { label: "Chấm công", href: "/attendance", icon: Fingerprint },
      { label: "Lịch làm & Ca", href: "/shifts", icon: CalendarDays },
      { label: "Báo cáo chấm công", href: "/attendance/reports", icon: BarChart3, roles: ["manager", "hr", "admin", "super_admin"] },
      { label: "Đổi ca & Tăng ca", href: "/shift-requests", icon: ArrowLeftRight },
      { label: "Điều chỉnh công", href: "/attendance/adjustments", icon: PenLine },
    ],
  },
  {
    label: "NHÂN SỰ",
    items: [
      { label: "Danh sách NV", href: "/employees", icon: Users },
      { label: "Hồ sơ cá nhân", href: "/profile", icon: UserCircle },
      { label: "Sơ đồ tổ chức", href: "/organization-chart", icon: Network },
      { label: "Tài liệu & HĐ", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "ĐƠN TỪ",
    items: [
      { label: "Nghỉ phép", href: "/leave", icon: TreePalm },
      { label: "Phê duyệt", href: "/approvals", icon: CheckSquare, roles: ["manager", "hr", "admin", "super_admin"] },
    ],
  },
  {
    label: "LƯƠNG & PHÚC LỢI",
    items: [
      { label: "Bảng lương", href: "/payroll", icon: Wallet },
      { label: "Phúc lợi", href: "/benefits", icon: Gift },
    ],
  },
  {
    label: "HIỆU SUẤT",
    items: [
      { label: "KPI", href: "/performance/kpi", icon: Target },
      { label: "Đánh giá NV", href: "/performance/reviews", icon: Star },
      { label: "Mục tiêu OKR", href: "/performance/okr", icon: Flag },
      { label: "Đào tạo", href: "/training", icon: GraduationCap },
      { label: "Onboarding", href: "/onboarding", icon: UserPlus },
    ],
  },
  {
    label: "TUYỂN DỤNG",
    items: [
      { label: "Tuyển dụng", href: "/recruitment", icon: Briefcase, roles: ["hr", "admin", "super_admin"] },
      { label: "Ứng viên", href: "/recruitment/candidates/1", icon: UserSearch, roles: ["hr", "admin", "super_admin"] },
    ],
  },
  {
    label: "HỆ THỐNG",
    items: [
      { label: "Thông báo", href: "/notifications", icon: Bell },
      { label: "Chat nội bộ", href: "/chat", icon: MessageCircle },
      { label: "Cảnh báo khẩn", href: "/emergency-alerts", icon: AlertTriangle, roles: ["hr", "admin", "super_admin"] },
      { label: "Nhật ký", href: "/activity-logs", icon: ScrollText, roles: ["hr", "admin", "super_admin"] },
      { label: "Cài đặt", href: "/settings", icon: Settings, roles: ["hr", "admin", "super_admin"] },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const { profile } = useAuthStore();
  const userRole = profile?.role || "employee"; // default to employee if not logged in

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 grid place-items-center">
              <span className="text-white font-black text-sm">KG</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">King&apos;s Grill</p>
              <p className="text-[11px] text-slate-400 font-medium">HR System v1.0</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-slate-100"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group) => {
            // Filter items based on user role
            const filteredItems = group.items.filter(item => 
              !item.roles || item.roles.includes(userRole)
            );

            // Hide group if no items left
            if (filteredItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn("sidebar-link", active && "sidebar-link-active")}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
