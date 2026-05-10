"use client";
import PageHeader, { Card } from "@/components/ui";
import { Network } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface OrgDept {
  dept: string;
  head: string;
  count: number;
}

interface OrgTop extends OrgDept {
  sub: OrgDept[];
}

const mockOrgData: OrgTop[] = [
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
  const [orgData, setOrgData] = useState<OrgTop[]>(mockOrgData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }

    (async () => {
      // Load departments with employee counts
      const { data: depts } = await supabase
        .from("departments")
        .select("id, name, parent_id")
        .eq("is_deleted", false)
        .order("name");

      if (!depts || depts.length === 0) { setLoading(false); return; }

      // Count employees per department
      const { data: empCounts } = await supabase
        .from("employees")
        .select("department_id")
        .eq("is_deleted", false);

      const countMap: Record<string, number> = {};
      empCounts?.forEach((e: any) => {
        if (e.department_id) countMap[e.department_id] = (countMap[e.department_id] || 0) + 1;
      });

      // Find department heads (employees with manager_id = null in each dept, or first employee)
      const { data: managers } = await supabase
        .from("employees")
        .select("id, full_name, department_id, manager_id")
        .eq("is_deleted", false)
        .is("manager_id", null);

      const headMap: Record<string, string> = {};
      managers?.forEach((m: any) => {
        if (m.department_id) headMap[m.department_id] = m.full_name;
      });

      // Build org structure: root departments (no parent) as top-level, children below
      const rootDepts = depts.filter(d => !d.parent_id);
      const childDepts = depts.filter(d => d.parent_id);

      const result: OrgTop[] = [];

      if (rootDepts.length > 0) {
        rootDepts.forEach(root => {
          const subs = childDepts
            .filter(c => c.parent_id === root.id)
            .map(c => ({
              dept: c.name,
              head: headMap[c.id] || "Chưa có",
              count: countMap[c.id] || 0,
            }));

          // Also add child-less departments as subs
          result.push({
            dept: root.name,
            head: headMap[root.id] || "Chưa có",
            count: countMap[root.id] || 0,
            sub: subs,
          });
        });
      } else {
        // Flat structure — all departments at same level
        const allSubs = depts.map(d => ({
          dept: d.name,
          head: headMap[d.id] || "Chưa có",
          count: countMap[d.id] || 0,
        }));
        const totalCount = allSubs.reduce((s, d) => s + d.count, 0);

        result.push({
          dept: "Ban Giám đốc",
          head: managers?.[0]?.full_name || "Giám đốc",
          count: totalCount,
          sub: allSubs,
        });
      }

      if (result.length > 0) setOrgData(result);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="Sơ đồ tổ chức" subtitle="Cấu trúc phòng ban King's Grill" icon={Network} />
        <Card><p className="text-sm text-slate-500 py-4 text-center">Đang tải...</p></Card>
      </>
    );
  }

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
