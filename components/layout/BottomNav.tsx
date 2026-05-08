"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Fingerprint, CalendarDays, Bell, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Trang chủ", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chấm công", href: "/attendance", icon: Fingerprint },
  { label: "Ca làm", href: "/shifts", icon: CalendarDays },
  { label: "Thông báo", href: "/notifications", icon: Bell },
  { label: "Hồ sơ", href: "/profile", icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
                active ? "text-brand-600" : "text-slate-400"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for notch phones */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
