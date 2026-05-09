"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { UserCircle, Shield, Bell as BellIcon, KeyRound, Upload, Camera } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { supabase } from "@/lib/supabase";
import { useRef, useState } from "react";

export default function ProfilePage() {
  const { profile, fetchProfile } = useAuthStore();
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!profile?.id) return;

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Also update employee record if linked
      if (profile.employee_id) {
        await supabase
          .from('employees')
          .update({ avatar_url: publicUrl })
          .eq('id', profile.employee_id);
      }

      await fetchProfile(profile.id);
      addToast({ title: "Thành công", message: "Đã cập nhật ảnh đại diện", type: "success" });
    } catch (error: any) {
      addToast({ title: "Lỗi", message: error.message || "Không thể tải ảnh lên", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" subtitle="Thông tin tài khoản và bảo mật" icon={UserCircle} />
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-20 w-20 rounded-2xl object-cover shrink-0 group-hover:opacity-75 transition-opacity" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-2xl font-bold shrink-0 group-hover:opacity-75 transition-opacity">
                {profile?.full_name?.split(" ").pop()?.slice(0, 2).toUpperCase() || "MA"}
              </div>
            )}
            <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-2xl">
              <Camera size={24} className="text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-white/50 rounded-2xl">
                <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            disabled={uploading}
          />

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || "Chưa cập nhật"}</h2>
            <p className="text-sm text-slate-500">Vai trò: {profile?.role || "employee"} {profile?.employee_id ? `· Mã NV: ${profile.employee_id}` : ""}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge tone="green">Đang hoạt động</StatusBadge>
              <StatusBadge tone="blue" className="capitalize">{profile?.role || "Employee"}</StatusBadge>
            </div>
          </div>
          <button className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200" onClick={() => fileInputRef.current?.click()}>
            {uploading ? "Đang tải..." : "Đổi ảnh"}
          </button>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Thông tin liên hệ">
          <div className="space-y-3">
            {[["Email", profile?.email || "Chưa cập nhật"], ["Điện thoại", "Chưa cập nhật"], ["Địa chỉ", "Chưa cập nhật"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Bảo mật">
          <div className="space-y-3">
            {[{ icon: KeyRound, label: "Đổi mật khẩu", sub: "Lần cuối: 15/04/2026" }, { icon: Shield, label: "Xác thực 2 bước", sub: "Đã bật" }, { icon: BellIcon, label: "Cài đặt thông báo", sub: "Email + Push" }].map((item) => (
               <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                 <item.icon size={18} className="text-brand-600 shrink-0" />
                 <div className="flex-1"><p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="text-xs text-slate-500">{item.sub}</p></div>
               </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
