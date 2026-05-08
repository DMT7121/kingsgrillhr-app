"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle, ChefHat } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      // Demo mode — skip auth, go to dashboard
      router.push("/dashboard");
      return;
    }

    if (mode === "login") {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        router.push("/dashboard");
      }
    } else {
      if (!fullName.trim()) { setError("Vui lòng nhập họ tên"); return; }
      const { error: err } = await signUp(email, password, fullName);
      if (err) {
        setError(err);
      } else {
        setSuccess("Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-700 items-center justify-center p-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/20" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute top-1/2 left-1/3 h-48 w-48 rounded-3xl bg-white/10 rotate-12" />
        </div>
        <div className="relative z-10 max-w-md text-white">
          <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm grid place-items-center mb-8">
            <ChefHat size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">
            King&apos;s Grill<br />HR System
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Hệ thống quản lý nhân sự toàn diện cho chuỗi nhà hàng King&apos;s Grill. 
            Chấm công, nghỉ phép, lương, KPI — tất cả trong một nền tảng.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Chi nhánh", value: "5+" },
              { label: "Nhân sự", value: "150" },
              { label: "Module", value: "8" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 grid place-items-center">
              <span className="text-white font-black text-sm">KG</span>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">King&apos;s Grill</p>
              <p className="text-xs text-slate-400">HR System v1.0</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            {mode === "login"
              ? "Chào mừng trở lại! Nhập thông tin để tiếp tục."
              : "Điền thông tin để tạo tài khoản mới."}
          </p>

          {!isSupabaseConfigured && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Chế độ Demo</p>
                <p className="mt-1 text-xs text-amber-700">
                  Supabase chưa được cấu hình. Nhấn &quot;Đăng nhập&quot; để vào chế độ xem thử.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-4">
              <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <AlertCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@kingsgrill.vn"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                required={isSupabaseConfigured}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  required={isSupabaseConfigured}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:from-brand-700 hover:to-brand-800 disabled:opacity-60 transition-all"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : mode === "login" ? (
                <><LogIn size={18} /> Đăng nhập</>
              ) : (
                <><UserPlus size={18} /> Đăng ký</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? (
              <>Chưa có tài khoản?{" "}
                <button onClick={() => { setMode("register"); setError(null); setSuccess(null); }} className="font-bold text-brand-600 hover:text-brand-700">
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>Đã có tài khoản?{" "}
                <button onClick={() => { setMode("login"); setError(null); setSuccess(null); }} className="font-bold text-brand-600 hover:text-brand-700">
                  Đăng nhập
                </button>
              </>
            )}
          </p>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 King&apos;s Grill. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
