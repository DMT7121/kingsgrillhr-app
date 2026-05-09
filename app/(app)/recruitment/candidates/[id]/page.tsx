"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { UserSearch, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  experience: string;
  status: string;
  job_title: string;
  notes: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const id = params?.id as string;
      if (!isSupabaseConfigured || !id) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("candidates")
        .select(`
          id, full_name, email, phone, source, experience, status, notes,
          recruitment_jobs:job_id(title)
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        const d = data as any;
        let statusStr = "CV mới";
        if (d.status === "screening") statusStr = "Sơ loại";
        if (d.status === "interview") statusStr = "Phỏng vấn";
        if (d.status === "offer") statusStr = "Offer";
        if (d.status === "hired") statusStr = "Đã tuyển";
        if (d.status === "rejected") statusStr = "Từ chối";

        setCandidate({
          id: d.id,
          name: d.full_name,
          email: d.email || "",
          phone: d.phone || "",
          source: d.source || "Không rõ",
          experience: d.experience || "Chưa cập nhật",
          status: statusStr,
          job_title: d.recruitment_jobs?.title || "Không rõ",
          notes: d.notes || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [params?.id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>;
  if (!candidate) return <div className="p-8 text-center text-slate-500">Không tìm thấy ứng viên</div>;

  const initials = candidate.name.split(" ").pop()?.slice(0, 2).toUpperCase() || "UV";
  const toneLookup: Record<string, "green" | "orange" | "blue" | "red" | "purple" | "gray"> = {
    "Đã tuyển": "green", "Phỏng vấn": "orange", "Offer": "blue", "Từ chối": "red", "Sơ loại": "purple"
  };

  return (
    <>
      <PageHeader title="Chi tiết ứng viên" icon={UserSearch}
        action={<Link href="/recruitment" className="flex items-center gap-1 text-sm text-brand-600 font-semibold"><ArrowLeft size={16} /> Quay lại</Link>} />
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 grid place-items-center text-white text-2xl font-bold">{initials}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
            <p className="text-sm text-slate-500">Ứng tuyển: {candidate.job_title}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge tone={toneLookup[candidate.status] || "gray"}>{candidate.status}</StatusBadge>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Thông tin ứng viên">
          <div className="space-y-3">
            {[
              ["Email", candidate.email || "Chưa cập nhật"],
              ["Điện thoại", candidate.phone || "Chưa cập nhật"],
              ["Nguồn", candidate.source],
              ["Kinh nghiệm", candidate.experience],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{k}</span><span className="text-sm font-semibold text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Ghi chú">
          {candidate.notes ? (
            <p className="text-sm text-slate-600 leading-relaxed">{candidate.notes}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Chưa có ghi chú nào.</p>
          )}
        </Card>
      </div>
    </>
  );
}
