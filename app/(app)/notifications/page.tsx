"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { Bell } from "lucide-react";
import { hrData, AppNotification } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.notifications.list().then(data => {
      setNotifications(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <PageHeader title="Thông báo" subtitle="Thông báo hệ thống và nhắc nhở" icon={Bell} />
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải thông báo...</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Bạn không có thông báo nào.</p>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className={!n.read ? "border-brand-200 bg-brand-50/30" : ""}>
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                  n.type === "success" ? "bg-emerald-100 text-emerald-600" :
                  n.type === "warning" ? "bg-orange-100 text-orange-600" :
                  n.type === "payroll" ? "bg-violet-100 text-violet-600" :
                  "bg-blue-100 text-blue-600"
                }`}><Bell size={18} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{n.body}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{n.time}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
