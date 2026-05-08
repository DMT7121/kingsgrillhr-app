"use client";
import PageHeader, { Card } from "@/components/ui";
import { Network } from "lucide-react";
const orgData = [
  { dept: "Ban Giám đốc", head: "Trần Văn Bình", count: 3, sub: [
    { dept: "Nhân sự", head: "Nguyễn Minh Anh", count: 12 },
    { dept: "Kế toán", head: "Lê Thuỳ Linh", count: 8 },
    { dept: "Kinh doanh", head: "Phạm Quốc Bảo", count: 28 },
    { dept: "Vận hành", head: "Đỗ Ngọc Mai", count: 42 },
    { dept: "Bếp", head: "Võ Đức Huy", count: 34 },
    { dept: "Dịch vụ", head: "Hoàng Thanh Sơn", count: 26 },
  ]}
];
export default function OrgChartPage() {
  return (
    <>
      <PageHeader title="Sơ đồ tổ chức" subtitle="Cấu trúc phòng ban King's Grill" icon={Network} />
      {orgData.map((top) => (
        <div key={top.dept}>
          <Card className="mb-6 bg-gradient-to-br from-brand-600 to-brand-800 border-0">
            <div className="text-center text-white">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-white/20 grid place-items-center text-2xl font-bold mb-3">{top.head.split(" ").pop()?.slice(0,2)}</div>
              <p className="text-lg font-bold">{top.head}</p>
              <p className="text-sm text-white/70">{top.dept} · {top.count} người</p>
            </div>
          </Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {top.sub.map((s) => (
              <Card key={s.dept}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-brand-100 grid place-items-center text-brand-700 font-bold shrink-0">{s.head.split(" ").pop()?.slice(0,2)}</div>
                  <div><p className="font-bold text-slate-900">{s.dept}</p><p className="text-xs text-slate-500">{s.head} · {s.count} người</p></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
