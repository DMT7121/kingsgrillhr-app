"use client";
import PageHeader, { Card } from "@/components/ui";
import { Network } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useState, useEffect } from "react";

interface OrgNode {
  name: string;
  position: string;
  department: string;
  branch: string;
  code: string;
}

export default function OrganizationChartPage() {
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("employees")
        .select(`
          full_name, employee_code,
          departments:department_id(name),
          positions:position_id(name),
          branches:branch_id(name)
        `)
        .eq("is_deleted", false)
        .eq("status", "active")
        .order("employee_code");

      if (!error && data) {
        setNodes(data.map((e: any) => ({
          name: e.full_name,
          code: e.employee_code,
          position: e.positions?.name || "Nhân viên",
          department: e.departments?.name || "Chưa phân bổ",
          branch: e.branches?.name || "HQ",
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  // Group by department
  const deptMap = new Map<string, OrgNode[]>();
  nodes.forEach(n => {
    if (!deptMap.has(n.department)) deptMap.set(n.department, []);
    deptMap.get(n.department)!.push(n);
  });

  return (
    <>
      <PageHeader title="Sơ đồ tổ chức" subtitle="Cấu trúc phòng ban & nhân sự" icon={Network} />
      {loading ? (
        <p className="text-sm text-slate-500 py-4 text-center">Đang tải sơ đồ tổ chức...</p>
      ) : deptMap.size === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">Chưa có dữ liệu nhân sự.</p>
      ) : (
        <div className="space-y-4">
          {Array.from(deptMap.entries()).map(([dept, members]) => (
            <Card key={dept} title={dept}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((m) => (
                  <div key={m.code} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 grid place-items-center font-bold text-sm shrink-0">
                      {m.name.split(" ").pop()?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.position} · {m.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
