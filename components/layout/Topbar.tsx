"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Menu, Search, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import Link from "next/link";

export default function Topbar() {
  const router = useRouter();
  const { toggleSidebar, currentUser, currentRole, setCurrentRole } = useAppStore();
  const { profile, signOut } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const roles = ["employee", "manager", "hr", "admin"] as const;

  // Resolve display name: use Supabase profile if available, fallback to mock
  const displayName = isSupabaseConfigured && profile ? profile.full_name : currentUser.name;
  const displayRole = isSupabaseConfigured && profile ? profile.role : currentRole;
  const initials = (displayName ?? "U")
    .split(" ")
    .pop()
    ?.slice(0, 2)
    .toUpperCase();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-slate-100 bg-white/90 backdrop-blur-md px-4 lg:px-6 h-16">
      {/* Hamburger mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
      >
        <Menu size={20} className="text-slate-600" />
      </button>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 flex-1 max-w-md bg-slate-50 rounded-xl px-4 py-2.5">
        <Search size={16} className="text-slate-400" />
        <input
          className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
          placeholder="Tìm kiếm nhân viên, đơn từ..."
        />
      </div>

      <div className="flex-1 md:hidden" />

      {/* Role switcher (demo mode only) */}
      {!isSupabaseConfigured && (
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value as typeof currentRole)}
          className="hidden sm:block text-xs font-semibold bg-brand-50 text-brand-700 rounded-lg px-3 py-1.5 border-0 outline-none cursor-pointer"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r.toUpperCase()}
            </option>
          ))}
        </select>
      )}

      {/* Notification */}
      <Link href="/notifications" className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
        <Bell size={18} className="text-slate-600" />
        <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
      </Link>

      {/* Avatar + Dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 focus:outline-none"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{displayName}</p>
            <p className="text-[11px] text-slate-400 capitalize">{displayRole}</p>
          </div>
        </button>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-slate-100 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-bold text-slate-900">{displayName}</p>
              <p className="text-xs text-slate-500 capitalize">{displayRole}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User size={16} /> Hồ sơ cá nhân
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
