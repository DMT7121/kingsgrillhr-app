"use client";
import PageHeader, { Card } from "@/components/ui";
import { Settings as SettingsIcon, Building2, Users, Shield, Bell, Palette, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";

const sections = [
  { icon: Building2, title: "Thông tin công ty", desc: "Tên, địa chỉ, logo, chi nhánh" },
  { icon: Users, title: "Phòng ban & Chức danh", desc: "Quản lý cấu trúc tổ chức" },
  { icon: Shield, title: "Vai trò & Phân quyền", desc: "Employee, Manager, HR, Admin" },
  { icon: Bell, title: "Cài đặt thông báo", desc: "Email, push, nhắc nhở tự động" },
  { icon: Palette, title: "Giao diện", desc: "Theme, ngôn ngữ, múi giờ" },
];

export default function SettingsPage() {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();

  const handleTestNotification = async () => {
    if (!profile?.employee_id) {
      addToast({ title: "Lỗi", message: "Bạn chưa có hồ sơ nhân viên", type: "error" });
      return;
    }

    const { error } = await supabase.from("notifications").insert({
      employee_id: profile.employee_id,
      title: "Thông báo kiểm tra",
      body: "Đây là một thông báo test Realtime từ hệ thống. Nếu bạn thấy popup này, Realtime đã hoạt động!",
      type: "system"
    });

    if (error) {
      addToast({ title: "Lỗi", message: error.message, type: "error" });
    }
  };

  return (
    <>
      <PageHeader title="Cài đặt" subtitle="Cấu hình hệ thống HR" icon={SettingsIcon} />
      
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Công cụ dành cho nhà phát triển</h3>
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">Kiểm tra Supabase Realtime</p>
            <p className="text-xs text-slate-500 mt-1">Gửi một thông báo test để kiểm tra tính năng đẩy thông báo trực tiếp (Push Notification). Hãy chắc chắn bạn đã chạy lệnh <code className="bg-slate-100 px-1 rounded text-pink-600">alter publication supabase_realtime add table public.notifications;</code> trong SQL Editor.</p>
          </div>
          <button 
            onClick={handleTestNotification}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 shrink-0"
          >
            <Zap size={16} className="text-yellow-400" />
            Test Push Notification
          </button>
        </Card>
      </div>

      <h3 className="text-sm font-bold text-slate-900 mb-3">Cấu hình chung</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className="cursor-pointer hover:shadow-soft transition-shadow">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-brand-50 grid place-items-center shrink-0">
                <s.icon size={22} className="text-brand-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
