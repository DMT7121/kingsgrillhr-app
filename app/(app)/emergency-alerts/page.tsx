"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { AlertTriangle } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface Alert {
  id: string;
  title: string;
  body: string;
  severity: string;
  time: string;
}

export default function EmergencyAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) { setLoading(false); return; }

      // Emergency alerts could be a special notification type or a dedicated table
      // Using notifications with type = 'alert' or 'emergency'
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, type, created_at")
        .in("type", ["alert", "emergency", "system"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setAlerts(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          body: n.body || "",
          severity: n.type === "emergency" ? "Khẩn cấp" : n.type === "alert" ? "Cảnh báo" : "Thông tin",
          time: new Date(n.created_at).toLocaleString("vi-VN"),
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <PageHeader title="Cảnh báo khẩn" subtitle="Thông báo khẩn cấp, bất thường" icon={AlertTriangle} />
      {loading ? (
        <p className="text-sm text-slate-500 py-4 text-center">Đang tải cảnh báo...</p>
      ) : alerts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-semibold">Không có cảnh báo khẩn nào</p>
            <p className="text-xs text-slate-400 mt-1">Hệ thống đang hoạt động bình thường</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start gap-3">
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                  a.severity === "Khẩn cấp" ? "bg-rose-100 text-rose-600" : 
                  a.severity === "Cảnh báo" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">{a.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{a.body}</p>
                  <p className="text-xs text-slate-400 mt-2">{a.time}</p>
                </div>
                <StatusBadge tone={a.severity === "Khẩn cấp" ? "red" : a.severity === "Cảnh báo" ? "orange" : "blue"}>{a.severity}</StatusBadge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
