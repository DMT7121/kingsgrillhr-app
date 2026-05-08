"use client";
import PageHeader, { Card, StatusBadge } from "@/components/ui";
import { ScrollText, Search } from "lucide-react";
import { hrData, ActivityLog } from "@/services/hr-data";
import { useState, useEffect } from "react";

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    hrData.activityLogs.list().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.actor.toLowerCase().includes(search.toLowerCase()) ||
    l.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader title="Nhật ký hoạt động" subtitle="Audit log thao tác hệ thống" icon={ScrollText} />
      <Card className="mb-4">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5">
          <Search size={16} className="text-slate-400" />
          <input 
            className="bg-transparent text-sm outline-none w-full" 
            placeholder="Tìm theo người dùng, module..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>
      <Card>
        {loading ? (
          <p className="text-sm text-slate-500 py-4 text-center">Đang tải nhật ký...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Không tìm thấy nhật ký hoạt động nào.</p>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="h-2.5 w-2.5 rounded-full bg-brand-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{l.action}</p>
                  <p className="text-xs text-slate-500">{l.actor}</p>
                </div>
                <StatusBadge tone="blue">{l.module}</StatusBadge>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{l.time}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
