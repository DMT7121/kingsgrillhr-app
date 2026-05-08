"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Fingerprint, CheckCircle, MapPin, Camera, Clock } from "lucide-react";
import { hrData, AttendanceRecord } from "@/services/hr-data";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AttendancePage() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuthStore();

  useEffect(() => {
    // If the user profile is available and linked to an employee_id, pass it
    hrData.attendance.history(profile?.employee_id || undefined).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [profile?.employee_id]);

  return (
    <>
      <PageHeader title="Chấm công" subtitle="Xác thực khuôn mặt và vị trí để bắt đầu ca làm" icon={Fingerprint} />

      {/* Camera Mock */}
      <Card className="mb-6">
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 h-56 md:h-72 flex items-center justify-center overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white/80">LIVE</span>
          </div>
          <div className="h-32 w-32 md:h-40 md:w-40 border-4 border-brand-400 rounded-3xl flex items-center justify-center">
            <Camera size={48} className="text-brand-300" />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <StatusBadge tone="green">✓ Khuôn mặt khớp</StatusBadge>
          </div>
        </div>
      </Card>

      {/* Employee Info */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-14 w-14 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-lg font-bold shrink-0">
              {profile?.full_name?.split(" ").pop()?.slice(0, 2).toUpperCase() || "MA"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">{profile?.full_name || "Nguyễn Minh Anh"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">Vai trò</span>
              <StatusBadge tone="blue">{profile?.role || "employee"}</StatusBadge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Ca hiện tại</p>
            <p className="font-bold text-brand-700">Ca sáng</p>
            <p className="text-xs text-slate-500">08:00 - 17:00</p>
          </div>
        </div>
      </Card>

      {/* GPS Verification */}
      <Card title="Xác thực vị trí" className="mb-6" action={<StatusBadge tone="green">Vị trí hợp lệ ✓</StatusBadge>}>
        <div className="rounded-xl bg-slate-50 p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-brand-600" />
              <span className="text-sm font-medium text-slate-700">Nhà hàng Hương Việt</span>
            </div>
            <StatusBadge tone="blue">18m</StatusBadge>
          </div>
          <p className="text-xs text-slate-500">125 Nguyễn Huệ, Q.1, TP.HCM</p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> GPS đã bật</span>
            <span>Độ chính xác: ±8m</span>
            <span>Bán kính: 50m</span>
          </div>
        </div>
      </Card>

      {/* Checklist */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {["Camera hoạt động", "Nhận diện thành công", "Vị trí trùng điểm", "Sẵn sàng ghi nhận"].map((item) => (
          <div key={item} className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-emerald-700">{item}</span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button className="flex items-center justify-center gap-3 rounded-2xl bg-brand-600 px-6 py-4 font-bold text-white shadow-lg shadow-brand-200 hover:bg-brand-700 transition-colors">
          <Fingerprint size={22} /> Chấm công vào ca
        </button>
        <button className="flex items-center justify-center gap-3 rounded-2xl border-2 border-brand-200 px-6 py-4 font-bold text-brand-700 hover:bg-brand-50 transition-colors">
          <Clock size={22} /> Chấm công ra ca
        </button>
      </div>

      {/* History */}
      <Card title="Lịch sử hôm nay" action={<span className="text-xs font-bold text-brand-600 cursor-pointer">Xem tất cả →</span>}>
        {loading ? (
          <p className="text-sm text-slate-500 py-2">Đang tải lịch sử...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Chưa có lịch sử chấm công hôm nay</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500 shrink-0" />
                <span className="text-sm font-bold text-slate-900 w-14">{h.time}</span>
                <span className="text-sm text-slate-600 flex-1">{h.action}</span>
                <StatusBadge tone="green">{h.status} ✓</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
