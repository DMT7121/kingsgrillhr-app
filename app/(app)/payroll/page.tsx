"use client";

import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Wallet, Download } from "lucide-react";
import { hrData, PayrollData } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function PayrollPage() {
  const [payrollData, setPayrollData] = useState<PayrollData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.payroll.get().then(data => {
      setPayrollData(data);
      setLoading(false);
    });
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatShort = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
    return amount.toString();
  };

  // Compute stats from fetched data
  const latest = payrollData?.latest;
  const totalIncome = latest ? latest.items.filter(i => !i.deduct).reduce((s, i) => s + i.amount, 0) : 0;
  const totalDeduct = latest ? latest.items.filter(i => i.deduct).reduce((s, i) => s + i.amount, 0) : 0;
  const netSalary = latest?.netSalary ?? 0;

  // Compute change vs previous month
  const prevNet = payrollData?.history && payrollData.history.length >= 2 ? payrollData.history[1]?.net ?? 0 : 0;
  const changePercent = prevNet > 0 ? Math.round(((netSalary - prevNet) / prevNet) * 100) : 0;
  const changeSub = prevNet > 0 ? `${changePercent >= 0 ? "+" : ""}${formatShort(netSalary - prevNet)}` : "";

  // Build chart from history
  const chartData = payrollData?.history
    ? [...payrollData.history].reverse().slice(-6).map(h => ({
        value: h.net / 1_000_000,
        label: h.period.replace("Tháng ", "T").replace("/2026", "").replace("/2025", ""),
      }))
    : [];

  return (
    <>
      <PageHeader title="Bảng lương" subtitle="Phiếu lương và lịch sử thu nhập" icon={Wallet}
        action={<button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white"><Download size={16} /> Tải phiếu lương</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Tổng thu nhập" value={loading ? "..." : formatShort(totalIncome)} sub={latest?.periodName || ""} tone="blue" />
        <StatCard label="Khấu trừ" value={loading ? "..." : formatShort(totalDeduct)} tone="red" />
        <StatCard label="Thực nhận" value={loading ? "..." : formatShort(netSalary)} tone="green" />
        <StatCard label="So tháng trước" value={loading ? "..." : `${changePercent >= 0 ? "+" : ""}${changePercent}%`} sub={changeSub} tone="purple" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card title={`Chi tiết phiếu lương — ${latest?.periodName || "Không có dữ liệu"}`}>
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Đang tải phiếu lương...</p>
          ) : !latest ? (
            <p className="text-sm text-slate-500 py-4 text-center">Chưa có phiếu lương nào.</p>
          ) : (
            <div className="space-y-2">
              {latest.items.map((item) => (
                <div key={item.label} className="flex justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className={`text-sm font-bold ${item.deduct ? "text-rose-600" : "text-slate-900"}`}>
                    {item.deduct ? "-" : ""}{formatMoney(item.amount)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-3 mt-2 border-t-2 border-brand-100">
                <span className="font-bold text-slate-900">Thực nhận</span>
                <span className="text-lg font-extrabold text-brand-700">{formatMoney(latest.netSalary)}</span>
              </div>
            </div>
          )}
        </Card>

        <Card title="Biểu đồ thu nhập">
          {loading ? (
            <p className="text-sm text-slate-500 py-4 text-center">Đang tải...</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">Chưa có dữ liệu</p>
          ) : (
            <div className="flex items-end gap-3 h-44">
              {chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-brand-600">{d.value.toFixed(1)}tr</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${Math.max((d.value / Math.max(...chartData.map(c => c.value), 1)) * 100, 5)}%` }} />
                  <span className="text-[10px] text-slate-400">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Lịch sử lương">
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500 py-2">Đang tải...</p>
          ) : payrollData?.history.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">Chưa có lịch sử nhận lương.</p>
          ) : (
            payrollData?.history.map((h, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-semibold text-slate-900">{h.period}</span>
                <span className="text-sm font-bold text-brand-700">{formatMoney(h.net)}</span>
                <StatusBadge tone="green">{h.status}</StatusBadge>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
