"use client";

import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Camera, MapPin, Clock, Sun, Moon, CheckCircle, Loader2, ImageIcon, RefreshCw } from "lucide-react";
import { hrData, AttendanceRecord } from "@/services/hr-data";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/* ────── helpers ────── */
function formatDateTime(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=vi`);
    const data = await res.json();
    if (data?.display_name) {
      // Shorten: take first 2-3 parts
      const parts = data.display_name.split(", ");
      return parts.slice(0, 3).join(", ");
    }
  } catch { /* ignore */ }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function drawWatermark(
  videoEl: HTMLVideoElement,
  info: { time: string; location: string; name: string; code: string; type: "VÀO CA" | "RA CA" },
  maxWidth = 800,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) { resolve(null); return; }

    // Scale down
    const scale = Math.min(maxWidth / vw, maxWidth / vh, 1);
    const w = Math.round(vw * scale);
    const h = Math.round(vh * scale);

    const canvas = document.createElement("canvas");
    const barH = Math.round(h * 0.18); // 18% height for watermark bar
    canvas.width = w;
    canvas.height = h + barH;
    const ctx = canvas.getContext("2d")!;

    // Draw video frame (mirrored for selfie)
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, w, h);
    ctx.restore();

    // Semi-transparent overlay bar at bottom
    const grad = ctx.createLinearGradient(0, h, 0, h + barH);
    grad.addColorStop(0, "rgba(15,23,42,0.95)");
    grad.addColorStop(1, "rgba(15,23,42,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, h, w, barH);

    // Text styling
    const fontSize = Math.max(11, Math.round(w * 0.028));
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.textBaseline = "top";

    const lineH = fontSize * 1.6;
    const padX = Math.round(w * 0.04);
    let y = h + Math.round(barH * 0.12);

    // Type badge
    const badgeColor = info.type === "VÀO CA" ? "#10b981" : "#f97316";
    const badgeText = info.type;
    const badgeW = ctx.measureText(badgeText).width + fontSize * 1.2;
    const badgeH = fontSize * 1.5;
    const badgeX = w - padX - badgeW;

    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    const r = badgeH / 2;
    ctx.roundRect(badgeX, y, badgeW, badgeH, r);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText(badgeText, badgeX + fontSize * 0.6, y + (badgeH - fontSize) / 2);

    // Location line
    ctx.fillStyle = "#94a3b8";
    ctx.font = `${fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText(`📍 ${info.location}`, padX, y);
    y += lineH;

    // Time line
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText(`🕐 ${info.time}`, padX, y);
    y += lineH;

    // Employee line
    ctx.fillStyle = "#cbd5e1";
    ctx.font = `${fontSize}px "Inter", "Segoe UI", sans-serif`;
    ctx.fillText(`👤 ${info.name} · ${info.code}`, padX, y);

    // Export as WebP
    canvas.toBlob((blob) => resolve(blob), "image/webp", 0.75);
  });
}

/* ────── component ────── */
export default function AttendancePage() {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [gpsStatus, setGpsStatus] = useState<"loading" | "ok" | "error">("loading");
  const [location, setLocation] = useState({ lat: 0, lng: 0, address: "", accuracy: 0 });

  const [currentShift, setCurrentShift] = useState({ name: "Chưa phân ca", time: "—" });
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [submitting, setSubmitting] = useState<"" | "checkin" | "checkout">("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [todayCheckedOut, setTodayCheckedOut] = useState(false);

  /* ── Camera ── */
  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err: any) {
        setCameraError(err.message || "Không thể truy cập camera");
      }
    })();
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  /* ── GPS ── */
  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus("error"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const addr = await reverseGeocode(latitude, longitude);
        setLocation({ lat: latitude, lng: longitude, address: addr, accuracy: Math.round(accuracy) });
        setGpsStatus("ok");
      },
      () => setGpsStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  /* ── Load shift + history ── */
  useEffect(() => {
    if (!profile?.employee_id) return;

    hrData.attendance.history(profile.employee_id).then((data) => {
      setHistory(data);
      setLoadingHistory(false);
      // Detect if already checked in / out today
      setTodayCheckedIn(data.some((r) => r.action === "Vào ca"));
      setTodayCheckedOut(data.some((r) => r.action === "Ra ca"));
    });

    if (isSupabaseConfigured) {
      const today = new Date().toISOString().slice(0, 10);
      supabase
        .from("shift_assignments")
        .select("work_shifts:shift_id(name, start_time, end_time)")
        .eq("employee_id", profile.employee_id)
        .eq("work_date", today)
        .limit(1)
        .then(({ data }) => {
          const sa = data?.[0] as any;
          if (sa?.work_shifts) {
            setCurrentShift({
              name: sa.work_shifts.name,
              time: `${sa.work_shifts.start_time?.slice(0, 5)} - ${sa.work_shifts.end_time?.slice(0, 5)}`,
            });
          }
        });
    }
  }, [profile?.employee_id]);

  /* ── Check-in / Check-out handler ── */
  const handleCheckAction = useCallback(async (type: "checkin" | "checkout") => {
    if (!videoRef.current || !cameraReady) {
      addToast({ title: "Lỗi", message: "Camera chưa sẵn sàng", type: "error" });
      return;
    }
    if (!profile?.employee_id) {
      addToast({ title: "Lỗi", message: "Tài khoản chưa liên kết nhân viên", type: "error" });
      return;
    }

    setSubmitting(type);
    const now = new Date();
    const typeLabel = type === "checkin" ? "VÀO CA" : "RA CA";

    try {
      // 1. Draw watermark on photo
      const blob = await drawWatermark(videoRef.current, {
        time: formatDateTime(now),
        location: location.address || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`,
        name: profile.full_name || "Nhân viên",
        code: profile.employee_id.slice(0, 8).toUpperCase(),
        type: typeLabel,
      });

      if (!blob) {
        addToast({ title: "Lỗi", message: "Không thể chụp ảnh", type: "error" });
        setSubmitting("");
        return;
      }

      // Preview
      setPreviewUrl(URL.createObjectURL(blob));

      // 2. Upload to Supabase Storage
      let photoUrl = "";
      if (isSupabaseConfigured) {
        const fileName = `${profile.employee_id}/${now.toISOString().slice(0, 10)}_${type}_${Date.now()}.webp`;
        const { error: uploadErr } = await supabase.storage
          .from("attendance-photos")
          .upload(fileName, blob, { contentType: "image/webp", upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from("attendance-photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      // 3. Insert or update attendance record
      if (isSupabaseConfigured) {
        const todayStr = now.toISOString().slice(0, 10);

        if (type === "checkin") {
          const { error } = await supabase.from("attendance_records").insert({
            employee_id: profile.employee_id,
            work_date: todayStr,
            check_in: now.toISOString(),
            status: "present",
            check_in_photo_url: photoUrl,
            check_in_lat: location.lat,
            check_in_lng: location.lng,
          });
          if (error) throw error;
          setTodayCheckedIn(true);
        } else {
          // Find today's record to update
          const { data: existing } = await supabase
            .from("attendance_records")
            .select("id, check_in")
            .eq("employee_id", profile.employee_id)
            .eq("work_date", todayStr)
            .order("check_in", { ascending: false })
            .limit(1)
            .single();

          if (existing) {
            const checkIn = new Date(existing.check_in);
            const workHours = Math.round(((now.getTime() - checkIn.getTime()) / 3600000) * 100) / 100;

            const { error } = await supabase
              .from("attendance_records")
              .update({
                check_out: now.toISOString(),
                work_hours: workHours,
                check_out_photo_url: photoUrl,
                check_out_lat: location.lat,
                check_out_lng: location.lng,
              })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            // Fallback: create new record
            const { error } = await supabase.from("attendance_records").insert({
              employee_id: profile.employee_id,
              work_date: todayStr,
              check_out: now.toISOString(),
              status: "present",
              check_out_photo_url: photoUrl,
            });
            if (error) throw error;
          }
          setTodayCheckedOut(true);
        }
      }

      addToast({
        title: `${typeLabel} thành công!`,
        message: `Đã ghi nhận lúc ${formatDateTime(now)}`,
        type: "success",
      });

      // Refresh history
      hrData.attendance.history(profile.employee_id).then(setHistory);
    } catch (err: any) {
      addToast({ title: "Lỗi", message: err.message || "Không thể chấm công", type: "error" });
    } finally {
      setSubmitting("");
    }
  }, [cameraReady, profile, location, addToast]);

  /* ── Render ── */
  return (
    <>
      <PageHeader
        title="Chấm công"
        subtitle="Chụp ảnh xác nhận vào ca / ra ca"
        icon={Camera}
      />

      {/* ═══ Camera Live ═══ */}
      <Card className="mb-4">
        <div className="relative rounded-2xl bg-slate-900 overflow-hidden">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-56 md:h-72 gap-3">
              <Camera size={40} className="text-slate-500" />
              <p className="text-sm text-slate-400">{cameraError}</p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-xs text-brand-400 hover:text-brand-300"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto rounded-2xl"
              style={{ transform: "scaleX(-1)", maxHeight: "360px", objectFit: "cover" }}
            />
          )}

          {/* Live badge */}
          {cameraReady && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Live</span>
            </div>
          )}

          {/* GPS status badge */}
          <div className="absolute top-3 right-3">
            {gpsStatus === "loading" && (
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <Loader2 size={12} className="text-amber-400 animate-spin" />
                <span className="text-[10px] font-bold text-white/70">GPS...</span>
              </div>
            )}
            {gpsStatus === "ok" && (
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <MapPin size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-white/70">±{location.accuracy}m</span>
              </div>
            )}
            {gpsStatus === "error" && (
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <MapPin size={12} className="text-rose-400" />
                <span className="text-[10px] font-bold text-white/70">GPS lỗi</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ═══ Employee + Shift info ═══ */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-12 w-12 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white text-base font-bold shrink-0">
              {profile?.full_name?.split(" ").pop()?.slice(0, 2).toUpperCase() || "NV"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-sm">{profile?.full_name || "Nhân viên"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <StatusBadge tone="blue">{profile?.role || "employee"}</StatusBadge>
              {gpsStatus === "ok" && (
                <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                  📍 {location.address}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Ca làm</p>
            <p className="font-bold text-brand-700 text-sm">{currentShift.name}</p>
            <p className="text-xs text-slate-500">{currentShift.time}</p>
          </div>
        </div>
      </Card>

      {/* ═══ Action Buttons ═══ */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* VÀO CA */}
        <button
          onClick={() => handleCheckAction("checkin")}
          disabled={!!submitting || todayCheckedIn || !cameraReady}
          className={`group relative overflow-hidden rounded-2xl px-4 py-5 md:py-6 text-white font-bold transition-all duration-200
            ${todayCheckedIn
              ? "bg-slate-200 text-slate-500 cursor-default shadow-none"
              : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 hover:scale-[1.02] active:scale-[0.98]"
            }
            disabled:hover:scale-100
          `}
        >
          {/* Glow effect */}
          {!todayCheckedIn && (
            <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="relative flex flex-col items-center gap-2">
            {submitting === "checkin" ? (
              <Loader2 size={28} className="animate-spin" />
            ) : todayCheckedIn ? (
              <CheckCircle size={28} className="text-emerald-500" />
            ) : (
              <Sun size={28} />
            )}
            <span className="text-sm">
              {todayCheckedIn ? "Đã vào ca ✓" : submitting === "checkin" ? "Đang xử lý..." : "VÀO CA"}
            </span>
            {!todayCheckedIn && !submitting && (
              <span className={`text-[10px] font-normal ${todayCheckedIn ? "text-slate-400" : "text-white/70"}`}>
                Bắt đầu ca làm
              </span>
            )}
          </div>
        </button>

        {/* RA CA */}
        <button
          onClick={() => handleCheckAction("checkout")}
          disabled={!!submitting || todayCheckedOut || !cameraReady || !todayCheckedIn}
          className={`group relative overflow-hidden rounded-2xl px-4 py-5 md:py-6 text-white font-bold transition-all duration-200
            ${todayCheckedOut
              ? "bg-slate-200 text-slate-500 cursor-default shadow-none"
              : !todayCheckedIn
              ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.98]"
            }
            disabled:hover:scale-100
          `}
        >
          {!todayCheckedOut && todayCheckedIn && (
            <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <div className="relative flex flex-col items-center gap-2">
            {submitting === "checkout" ? (
              <Loader2 size={28} className="animate-spin" />
            ) : todayCheckedOut ? (
              <CheckCircle size={28} className="text-orange-500" />
            ) : (
              <Moon size={28} />
            )}
            <span className="text-sm">
              {todayCheckedOut ? "Đã ra ca ✓" : submitting === "checkout" ? "Đang xử lý..." : "RA CA"}
            </span>
            {!todayCheckedOut && todayCheckedIn && !submitting && (
              <span className="text-[10px] font-normal text-white/70">Kết thúc ca làm</span>
            )}
          </div>
        </button>
      </div>

      {/* ═══ Preview last photo ═══ */}
      {previewUrl && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon size={16} className="text-brand-600" />
            <p className="text-sm font-bold text-slate-900">Ảnh vừa chụp</p>
          </div>
          <img
            src={previewUrl}
            alt="Check-in photo"
            className="w-full rounded-xl"
          />
        </Card>
      )}

      {/* ═══ History ═══ */}
      <Card
        title="Lịch sử hôm nay"
        action={<span className="text-xs font-bold text-brand-600 cursor-pointer">Xem tất cả →</span>}
      >
        {loadingHistory ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 size={16} className="animate-spin text-slate-400" />
            <span className="text-sm text-slate-500">Đang tải...</span>
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Chưa có lịch sử chấm công hôm nay</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={h.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                  h.action === "Vào ca"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-orange-100 text-orange-600"
                }`}>
                  {h.action === "Vào ca" ? <Sun size={16} /> : <Moon size={16} />}
                </div>
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
