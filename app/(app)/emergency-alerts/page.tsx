"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { AlertTriangle, Send } from "lucide-react";
const alerts = [
  { title: "Cháy bếp nhỏ tại chi nhánh Q.7", level: "Cao", time: "10 phút trước", confirmed: 12, total: 15, status: "Đang xử lý" },
  { title: "Mất điện chi nhánh Thủ Đức", level: "Trung bình", time: "2 giờ trước", confirmed: 8, total: 8, status: "Đã xử lý" },
  { title: "Nhân viên bị tai nạn lao động", level: "Cao", time: "1 ngày trước", confirmed: 20, total: 20, status: "Đã xử lý" },
];
export default function EmergencyAlertsPage() {
  return (
    <>
      <PageHeader title="Cảnh báo khẩn" subtitle="Gửi và quản lý cảnh báo khẩn cấp" icon={AlertTriangle}
        action={<button className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white"><Send size={16} /> Gửi cảnh báo</button>} />
      <div className="space-y-3">
        {alerts.map((a) => (
          <Card key={a.title} className={a.status === "Đang xử lý" ? "border-rose-200 bg-rose-50/30" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={a.level === "Cao" ? "text-rose-600" : "text-orange-500"} />
                <p className="font-bold text-slate-900">{a.title}</p>
              </div>
              <StatusBadge tone={a.status === "Đang xử lý" ? "red" : "green"}>{a.status}</StatusBadge>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Mức độ: <strong className={a.level === "Cao" ? "text-rose-600" : "text-orange-600"}>{a.level}</strong></span>
              <span>{a.time}</span>
              <span>Đã xác nhận: {a.confirmed}/{a.total}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
