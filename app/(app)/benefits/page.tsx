"use client";
import PageHeader, { StatCard, Card, StatusBadge } from "@/components/ui";
import { Gift } from "lucide-react";
import { hrData, EmployeeBenefit } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function BenefitsPage() {
  const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrData.benefits.list().then(data => {
      setBenefits(data);
      setLoading(false);
    });
  }, []);

  const totalAmount = benefits.reduce((acc, b) => acc + b.amount, 0);
  const activeCount = benefits.filter(b => b.status === "Đang hiệu lực").length;

  return (
    <>
      <PageHeader title="Phúc lợi" subtitle="Bảo hiểm, trợ cấp, ưu đãi nhân viên" icon={Gift} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label="Tổng phúc lợi" value={loading ? "-" : benefits.length.toString()} tone="blue" />
        <StatCard label="Đang hưởng" value={loading ? "-" : activeCount.toString()} tone="green" />
        <StatCard label="Tổng giá trị/năm" value={loading ? "-" : (totalAmount / 1000000).toFixed(1) + "M"} tone="purple" />
      </div>
      
      {loading ? (
        <p className="text-sm text-slate-500 py-4 text-center">Đang tải phúc lợi...</p>
      ) : benefits.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Bạn chưa có gói phúc lợi nào.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {benefits.map((b) => (
            <Card key={b.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-slate-900">{b.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{b.description}</p>
                </div>
                <StatusBadge tone={b.status === "Đang hiệu lực" ? "green" : "purple"}>{b.status}</StatusBadge>
              </div>
              <p className="text-sm font-semibold text-brand-700">{b.amount.toLocaleString("vi-VN")} ₫</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
