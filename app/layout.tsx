import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import ToastProvider from "@/components/ToastProvider";
import RealtimeProvider from "@/components/RealtimeProvider";

export const metadata: Metadata = {
  title: "King's Grill HR System",
  description: "Hệ thống quản lý nhân sự King's Grill — Chấm công, nghỉ phép, lương, KPI, tuyển dụng",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <ToastProvider />
        <RealtimeProvider />
      </body>
    </html>
  );
}
