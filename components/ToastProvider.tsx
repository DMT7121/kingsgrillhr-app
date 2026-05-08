"use client";
import { useToastStore } from "@/store/useToastStore";
import { X, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 w-80 p-4 rounded-xl shadow-lg border bg-white animate-in slide-in-from-right-8 duration-300",
            t.type === "error" ? "border-red-100" : "border-slate-100"
          )}
        >
          <div className={cn(
            "h-8 w-8 rounded-lg grid place-items-center shrink-0",
            t.type === "error" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-600"
          )}>
            <Bell size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900">{t.title}</p>
            {t.message && <p className="text-xs text-slate-500 mt-1">{t.message}</p>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="p-1 rounded-md hover:bg-slate-100 shrink-0"
          >
            <X size={14} className="text-slate-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
