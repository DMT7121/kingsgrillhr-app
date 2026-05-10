"use client";

import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Camera, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { loadFaceModels, extractDescriptor } from "@/lib/face-detection";

export default function RegisterFacePage() {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [samples, setSamples] = useState<Float32Array[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const REQUIRED_SAMPLES = 3;

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; setCameraReady(true); }
      } catch { /* ignore */ }
    })();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => { loadFaceModels().then(setModelsLoaded); }, []);

  const captureSample = async () => {
    if (!videoRef.current || !modelsLoaded || capturing) return;
    setCapturing(true);
    const desc = await extractDescriptor(videoRef.current);
    if (desc) {
      setSamples(prev => [...prev, desc]);
      addToast({ title: `Mẫu ${samples.length + 1}/${REQUIRED_SAMPLES}`, message: "Đã chụp thành công", type: "success" });
    } else {
      addToast({ title: "Thất bại", message: "Không phát hiện khuôn mặt. Hãy nhìn thẳng vào camera.", type: "error" });
    }
    setCapturing(false);
  };

  const saveDescriptor = async () => {
    if (samples.length < REQUIRED_SAMPLES || !profile?.employee_id) return;
    setSaving(true);
    try {
      // Average the descriptors
      const avg = new Float32Array(128);
      samples.forEach(s => { for (let i = 0; i < 128; i++) avg[i] += s[i]; });
      for (let i = 0; i < 128; i++) avg[i] /= samples.length;

      const descriptorArray = Array.from(avg);

      const { error } = await supabase.from("employees").update({ face_descriptor: descriptorArray }).eq("id", profile.employee_id);
      if (error) throw error;
      setDone(true);
      addToast({ title: "Thành công!", message: "Đã lưu khuôn mặt. Bạn có thể chấm công bằng Face ID.", type: "success" });
    } catch (err: any) {
      addToast({ title: "Lỗi", message: err.message || "Không thể lưu", type: "error" });
    } finally { setSaving(false); }
  };

  if (done) {
    return (
      <>
        <PageHeader title="Đăng ký khuôn mặt" icon={Camera} />
        <Card className="text-center py-16">
          <div className="h-20 w-20 rounded-3xl bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-6"><CheckCircle size={40} /></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Đăng ký thành công!</h2>
          <p className="text-sm text-slate-500 mb-6">Khuôn mặt của bạn đã được lưu. Giờ bạn có thể chấm công bằng Face ID.</p>
          <Link href="/attendance" className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-bold text-sm">
            <ArrowLeft size={16} /> Quay lại Chấm công
          </Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Đăng ký khuôn mặt" subtitle="Chụp 3 ảnh để hệ thống nhận diện bạn" icon={Camera}
        action={<Link href="/attendance" className="flex items-center gap-1 text-sm text-brand-600 font-semibold"><ArrowLeft size={16} /> Quay lại</Link>} />

      {/* Camera */}
      <Card className="mb-4">
        <div className="relative rounded-2xl bg-slate-900 overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-2xl" style={{ transform: "scaleX(-1)" }} />
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white/80">LIVE</span>
          </div>
          {!modelsLoaded && <div className="absolute top-3 right-3"><StatusBadge tone="orange"><Loader2 size={12} className="animate-spin inline mr-1" /> Đang tải AI...</StatusBadge></div>}
        </div>
      </Card>

      {/* Progress */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-slate-900 text-sm">Tiến trình chụp mẫu</p>
          <span className="text-sm font-bold text-brand-600">{samples.length}/{REQUIRED_SAMPLES}</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden mb-4">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all" style={{ width: `${(samples.length / REQUIRED_SAMPLES) * 100}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: REQUIRED_SAMPLES }).map((_, i) => (
            <div key={i} className={`text-center p-3 rounded-xl text-xs font-semibold ${i < samples.length ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
              {i < samples.length ? "✅ Đã chụp" : `Mẫu ${i + 1}`}
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="mb-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          📌 <strong>Hướng dẫn:</strong> Nhìn thẳng vào camera, đảm bảo đủ ánh sáng. Chụp 3 mẫu ở các góc hơi khác nhau (thẳng, nghiêng trái, nghiêng phải) để tăng độ chính xác.
        </p>
      </Card>

      {/* Actions */}
      {samples.length < REQUIRED_SAMPLES ? (
        <button onClick={captureSample} disabled={!cameraReady || !modelsLoaded || capturing}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-bold text-sm transition-colors ${cameraReady && modelsLoaded ? "bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          {capturing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          {capturing ? "Đang chụp..." : `Chụp mẫu ${samples.length + 1}`}
        </button>
      ) : (
        <button onClick={saveDescriptor} disabled={saving}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-6 py-4 font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {saving ? "Đang lưu..." : "Lưu khuôn mặt"}
        </button>
      )}
    </>
  );
}
