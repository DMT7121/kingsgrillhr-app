"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { FileText, Upload, Download } from "lucide-react";
import { hrData, AppDocument } from "@/services/hr-data";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { supabase } from "@/lib/supabase";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();

  const loadDocuments = () => {
    setLoading(true);
    hrData.documents.list().then(data => {
      setDocuments(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!profile?.employee_id) {
        addToast({ title: "Lỗi", message: "Bạn chưa có hồ sơ nhân viên", type: "error" });
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.employee_id}-${Date.now()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL (or signed URL if private)
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // 3. Insert record into database
      const { error: dbError } = await supabase.from("documents").insert({
        employee_id: profile.employee_id,
        title: file.name,
        document_type: "Cá nhân",
        file_url: publicUrl,
        file_size_bytes: file.size,
        is_confidential: false
      });

      if (dbError) throw dbError;

      addToast({ title: "Thành công", message: "Đã tải tài liệu lên", type: "success" });
      loadDocuments();
    } catch (error: any) {
      addToast({ title: "Lỗi", message: error.message || "Không thể tải tài liệu lên", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const total = documents.length;
  const signed = documents.filter(d => d.status === "Đã ký" || d.status === "Đã nộp").length;

  const pendingSigning = documents.filter(d => d.status === "Chờ ký").length;
  const expiringSoon = 0; // No expiry date field in current schema

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <PageHeader title="Tài liệu & Hợp đồng" subtitle="Hồ sơ, hợp đồng, quyết định" icon={FileText}
        action={
          <>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={uploading} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />} 
              {uploading ? "Đang tải..." : "Upload"}
            </button>
          </>
        } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng tài liệu" value={loading ? "-" : total.toString()} tone="blue" />
        <StatCard label="Đã ký / Đã nộp" value={loading ? "-" : signed.toString()} tone="green" />
        <StatCard label="Chờ ký" value={loading ? "-" : pendingSigning.toString()} tone="orange" />
        <StatCard label="Sắp hết hạn" value={loading ? "-" : expiringSoon.toString()} tone="red" />
      </div>
      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải tài liệu...</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Bạn chưa có tài liệu nào.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-brand-50 grid place-items-center shrink-0"><FileText size={18} className="text-brand-600" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{d.title}</p>
                  <p className="text-xs text-slate-500">{d.type} · {d.date} · {formatBytes(d.size)}</p>
                </div>
                <StatusBadge tone={d.status === "Đã ký" || d.status === "Đã nộp" ? "green" : d.status === "Chờ ký" ? "orange" : "blue"}>{d.status}</StatusBadge>
                <a href={d.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-slate-100">
                  <Download size={16} className="text-slate-400" />
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
