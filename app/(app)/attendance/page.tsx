"use client";

import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Fingerprint, Clock, MapPin, Camera, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentPosition, reverseGeocode, haversineDistance, captureWatermarkedPhoto, GpsPosition } from "@/lib/attendance-utils";
import { loadFaceModels, detectFace, matchFace, FaceMatchResult } from "@/lib/face-detection";
import Link from "next/link";

interface ShiftInfo { name: string; start: string; end: string; shiftId: string; }
interface HistoryItem { id: string; time: string; action: string; status: string; }

export default function AttendancePage() {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Face
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceResult, setFaceResult] = useState<FaceMatchResult | null>(null);
  const [faceScanning, setFaceScanning] = useState(false);

  // GPS
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [address, setAddress] = useState("");
  const [branchName, setBranchName] = useState("");
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [gpsValid, setGpsValid] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Shift & Leave
  const [shift, setShift] = useState<ShiftInfo | null>(null);
  const [onLeave, setOnLeave] = useState(false);
  const [leaveInfo, setLeaveInfo] = useState("");

  // History & State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── 1. Start camera ───
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 }, audio: false });
        if (videoRef.current) { videoRef.current.srcObject = stream; setCameraReady(true); }
      } catch { setCameraError("Không thể bật camera. Vui lòng cấp quyền."); }
    })();
    return () => { stream?.getTracks().forEach(t => t.stop()); if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, []);

  // ─── 2. Load face models ───
  useEffect(() => {
    loadFaceModels().then(ok => setModelsLoaded(ok));
  }, []);

  // ─── 3. Face scanning loop ───
  const storedFacesRef = useRef<{ employeeId: string; employeeName: string; descriptor: number[] }[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.from("employees").select("id, full_name, face_descriptor").not("face_descriptor", "is", null).eq("is_deleted", false)
      .then(({ data }) => {
        if (data) storedFacesRef.current = data.map((e: any) => ({ employeeId: e.id, employeeName: e.full_name, descriptor: e.face_descriptor }));
      });
  }, []);

  useEffect(() => {
    if (!cameraReady || !modelsLoaded) return;
    setFaceScanning(true);
    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      const det = await detectFace(videoRef.current);
      if (det && storedFacesRef.current.length > 0) {
        const result = matchFace(det.descriptor, storedFacesRef.current);
        setFaceResult(result);
      } else if (det) {
        setFaceResult({ matched: false, employeeId: null, employeeName: null, distance: 0, confidence: 0 });
      } else {
        setFaceResult(null);
      }
    }, 800);
    return () => { if (scanIntervalRef.current) clearInterval(scanIntervalRef.current); };
  }, [cameraReady, modelsLoaded]);

  // ─── 4. GPS + Reverse Geocoding ───
  useEffect(() => {
    (async () => {
      try {
        const pos = await getCurrentPosition();
        setGps(pos);
        const addr = await reverseGeocode(pos.lat, pos.lng);
        setAddress(addr);

        if (!isSupabaseConfigured) return;
        const { data: branches } = await supabase.from("branches").select("name, lat, lng, radius_meters").eq("is_deleted", false);
        if (branches && branches.length > 0) {
          let closest = { name: "", dist: Infinity, radius: 150 };
          branches.forEach((b: any) => {
            if (b.lat && b.lng) {
              const d = haversineDistance(pos.lat, pos.lng, Number(b.lat), Number(b.lng));
              if (d < closest.dist) closest = { name: b.name, dist: d, radius: b.radius_meters || 150 };
            }
          });
          setBranchName(closest.name);
          setDistanceM(Math.round(closest.dist));
          setGpsValid(closest.dist <= closest.radius);
        }
      } catch (e: any) { setGpsError(e.message || "Không lấy được vị trí"); }
    })();
  }, []);

  // ─── 5. Load shift today + leave check + history ───
  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.employee_id) { setLoading(false); return; }
    const empId = profile.employee_id;
    const today = new Date().toISOString().slice(0, 10);

    (async () => {
      // Shift today
      const { data: sa } = await supabase.from("shift_assignments").select("shift_id, work_shifts(name, start_time, end_time)")
        .eq("employee_id", empId).eq("work_date", today).limit(1);
      if (sa && sa.length > 0) {
        const s = (sa[0] as any).work_shifts;
        if (s) setShift({ name: s.name, start: s.start_time?.slice(0, 5), end: s.end_time?.slice(0, 5), shiftId: sa[0].shift_id });
      }

      // Leave check
      const { data: lr } = await supabase.from("leave_requests").select("from_date, to_date, leave_types:leave_type_id(name)")
        .eq("employee_id", empId).eq("status", "approved").lte("from_date", today).gte("to_date", today).limit(1);
      if (lr && lr.length > 0) { setOnLeave(true); setLeaveInfo((lr[0] as any).leave_types?.name || "Nghỉ phép"); }

      // Today's attendance
      const { data: att } = await supabase.from("attendance_records").select("id, check_in_at, check_out_at, status")
        .eq("employee_id", empId).eq("work_date", today).limit(1);
      if (att && att.length > 0) {
        const rec = att[0] as any;
        const items: HistoryItem[] = [];
        if (rec.check_in_at) { items.push({ id: rec.id + "-in", time: new Date(rec.check_in_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), action: "Vào ca", status: rec.status === "late" ? "Trễ" : "Đúng giờ" }); setCheckedIn(true); }
        if (rec.check_out_at) { items.push({ id: rec.id + "-out", time: new Date(rec.check_out_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), action: "Ra ca", status: "Thành công" }); }
        setHistory(items);
      }
      setLoading(false);
    })();
  }, [profile?.employee_id]);

  // ─── 6. Handle check-in / check-out ───
  const handleAttendance = useCallback(async (action: "in" | "out") => {
    if (!profile?.employee_id || !gps || submitting) return;
    setSubmitting(true);
    try {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const empId = profile.employee_id;

      // Capture watermarked photo
      let photoUrl: string | null = null;
      if (videoRef.current) {
        const blob = await captureWatermarkedPhoto(videoRef.current, {
          address: address || `${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}`,
          dateTime: now.toLocaleString("vi-VN"),
          employeeName: profile.full_name || "NV",
          employeeCode: faceResult?.employeeName ? "" : (profile.employee_id || ""),
          action: action === "in" ? "Vào ca" : "Ra ca",
        });
        if (blob) {
          const fileName = `${empId}_${today}_${action}_${Date.now()}.jpg`;
          const { error: upErr } = await supabase.storage.from("attendance-photos").upload(fileName, blob, { contentType: "image/jpeg" });
          if (!upErr) { const { data: { publicUrl } } = supabase.storage.from("attendance-photos").getPublicUrl(fileName); photoUrl = publicUrl; }
        }
      }

      // Determine late status
      let status: string = "valid";
      if (action === "in" && shift) {
        const [sh, sm] = shift.start.split(":").map(Number);
        const shiftStartMin = sh * 60 + sm;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin > shiftStartMin + 5) status = "late";
      }
      if (!gpsValid) status = "outside_location";

      if (action === "in") {
        const { error } = await supabase.from("attendance_records").upsert({
          employee_id: empId, work_date: today, check_in_at: now.toISOString(),
          check_in_lat: gps.lat, check_in_lng: gps.lng, check_in_photo_url: photoUrl, status,
        }, { onConflict: "employee_id,work_date" });
        if (error) throw error;
        setCheckedIn(true);
        setHistory(prev => [...prev, { id: "new-in", time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), action: "Vào ca", status: status === "late" ? "Trễ" : "Đúng giờ" }]);

        // Push notification if late
        if (status === "late") {
          await supabase.from("notifications").insert({ employee_id: empId, type: "attendance", title: "Chấm công trễ ca", body: `Bạn đã vào ca trễ lúc ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` });
        }
      } else {
        const { error } = await supabase.from("attendance_records").update({
          check_out_at: now.toISOString(), check_out_lat: gps.lat, check_out_lng: gps.lng, check_out_photo_url: photoUrl,
        }).eq("employee_id", empId).eq("work_date", today);
        if (error) throw error;
        setHistory(prev => [...prev, { id: "new-out", time: now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), action: "Ra ca", status: "Thành công" }]);
      }

      // Activity log
      await supabase.from("activity_logs").insert({ actor_id: empId, action: action === "in" ? "CHECK_IN" : "CHECK_OUT", target_table: "attendance_records", metadata: { lat: gps.lat, lng: gps.lng, address, face_matched: faceResult?.matched, distance_m: distanceM } });

      addToast({ title: "Thành công", message: action === "in" ? "Đã chấm công vào ca" : "Đã chấm công ra ca", type: "success" });
    } catch (err: any) {
      addToast({ title: "Lỗi", message: err.message || "Không thể chấm công", type: "error" });
    } finally { setSubmitting(false); }
  }, [profile, gps, address, gpsValid, faceResult, shift, distanceM, submitting, addToast]);

  // Checklist
  const checks = [
    { label: "Camera", ok: cameraReady },
    { label: "Khuôn mặt", ok: faceResult?.matched ?? false },
    { label: "Vị trí", ok: gpsValid },
    { label: "Sẵn sàng", ok: cameraReady && (faceResult?.matched ?? false) && gpsValid },
  ];
  const allReady = checks.every(c => c.ok);

  // ─── On leave screen ───
  if (onLeave) {
    return (
      <>
        <PageHeader title="Chấm công" icon={Fingerprint} />
        <Card className="text-center py-12">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-4"><CheckCircle size={32} /></div>
          <p className="text-lg font-bold text-slate-900">Bạn đang nghỉ phép</p>
          <p className="text-sm text-slate-500 mt-2">{leaveInfo} — Không cần chấm công hôm nay</p>
          <Link href="/leave" className="inline-block mt-4 text-sm font-bold text-brand-600">Xem chi tiết nghỉ phép →</Link>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Chấm công" subtitle="Xác thực khuôn mặt và vị trí để ghi nhận ca làm" icon={Fingerprint} />

      {/* ── Camera ── */}
      <Card className="mb-4">
        <div className="relative rounded-2xl bg-slate-900 overflow-hidden" style={{ minHeight: 280 }}>
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/80 gap-3">
              <XCircle size={40} /><p className="text-sm">{cameraError}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto rounded-2xl mirror" style={{ transform: "scaleX(-1)" }} />
          )}
          {/* LIVE badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-white/80">LIVE</span>
          </div>
          {/* Face detection overlay */}
          {cameraReady && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              {faceResult === null && faceScanning && <StatusBadge tone="gray">Đang quét khuôn mặt...</StatusBadge>}
              {faceResult && faceResult.matched && <StatusBadge tone="green">✅ {faceResult.employeeName} ({faceResult.confidence}%)</StatusBadge>}
              {faceResult && !faceResult.matched && <StatusBadge tone="red">❌ Không nhận diện được</StatusBadge>}
            </div>
          )}
          {!modelsLoaded && cameraReady && (
            <div className="absolute top-3 right-3"><StatusBadge tone="orange"><Loader2 size={12} className="animate-spin inline mr-1" />Đang tải AI...</StatusBadge></div>
          )}
        </div>
      </Card>

      {/* ── Shift today ── */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 grid place-items-center shrink-0"><Clock size={20} /></div>
            <div>
              {loading ? <p className="text-sm text-slate-500">Đang tải ca...</p> : shift ? (
                <><p className="font-bold text-slate-900 text-sm">{shift.name}</p><p className="text-xs text-slate-500">{shift.start} - {shift.end}</p></>
              ) : (
                <><p className="font-bold text-orange-600 text-sm">Không có ca hôm nay</p><p className="text-xs text-slate-500">Liên hệ quản lý nếu cần</p></>
              )}
            </div>
          </div>
          <Link href="/shifts" className="text-xs font-bold text-brand-600">Xem lịch →</Link>
        </div>
      </Card>

      {/* ── GPS ── */}
      <Card className="mb-4" title="Xác thực vị trí" action={gpsValid ? <StatusBadge tone="green">✅ Hợp lệ</StatusBadge> : gpsError ? <StatusBadge tone="red">Lỗi GPS</StatusBadge> : gps ? <StatusBadge tone="orange">⚠️ Ngoài phạm vi</StatusBadge> : <StatusBadge tone="gray">Đang lấy...</StatusBadge>}>
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-start gap-2 mb-2">
            <MapPin size={16} className="text-brand-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              {address ? <p className="text-sm font-medium text-slate-700 break-words">{address}</p> : <p className="text-sm text-slate-500">Đang xác định vị trí...</p>}
              {branchName && <p className="text-xs text-slate-500 mt-1">Chi nhánh: <strong>{branchName}</strong></p>}
            </div>
            {distanceM !== null && <StatusBadge tone="blue">{distanceM}m</StatusBadge>}
          </div>
          {gps && (
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> GPS đã bật</span>
              <span>Độ chính xác: ±{Math.round(gps.accuracy)}m</span>
            </div>
          )}
          {gpsError && <p className="text-xs text-red-500 mt-2"><AlertTriangle size={12} className="inline mr-1" />{gpsError}</p>}
        </div>
      </Card>

      {/* ── Checklist ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {checks.map(c => (
          <div key={c.label} className={`flex items-center gap-2 p-3 rounded-xl ${c.ok ? "bg-emerald-50" : "bg-slate-50"}`}>
            {c.ok ? <CheckCircle size={16} className="text-emerald-600 shrink-0" /> : <XCircle size={16} className="text-slate-300 shrink-0" />}
            <span className={`text-xs font-semibold ${c.ok ? "text-emerald-700" : "text-slate-400"}`}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Action Buttons ── */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => handleAttendance("in")} disabled={!allReady || checkedIn || submitting}
          className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-bold text-sm transition-colors ${allReady && !checkedIn ? "bg-brand-600 text-white shadow-lg shadow-brand-200 hover:bg-brand-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Fingerprint size={18} />} {checkedIn ? "Đã vào ca" : "Vào ca"}
        </button>
        <button onClick={() => handleAttendance("out")} disabled={!allReady || !checkedIn || submitting}
          className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 font-bold text-sm transition-colors ${allReady && checkedIn ? "border-2 border-brand-200 text-brand-700 hover:bg-brand-50" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />} Ra ca
        </button>
      </div>

      {/* ── History ── */}
      <Card title="Lịch sử hôm nay" action={<Link href="/attendance/reports" className="text-xs font-bold text-brand-600">Xem báo cáo →</Link>}>
        {loading ? <p className="text-sm text-slate-500 py-2">Đang tải...</p> : history.length === 0 ? <p className="text-sm text-slate-500 py-2">Chưa có lịch sử chấm công hôm nay</p> : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${h.status === "Trễ" ? "bg-orange-500" : "bg-brand-500"}`} />
                <span className="text-sm font-bold text-slate-900 w-14">{h.time}</span>
                <span className="text-sm text-slate-600 flex-1">{h.action}</span>
                <StatusBadge tone={h.status === "Trễ" ? "orange" : "green"}>{h.status}</StatusBadge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Register face link ── */}
      {!faceResult?.matched && (
        <div className="mt-4 text-center">
          <Link href="/attendance/register-face" className="text-sm font-bold text-brand-600 hover:underline">
            📸 Đăng ký khuôn mặt lần đầu →
          </Link>
        </div>
      )}
    </>
  );
}
