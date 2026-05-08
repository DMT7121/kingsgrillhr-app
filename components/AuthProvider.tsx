"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * AuthProvider — Initializes Supabase auth session on mount.
 * In demo mode (no Supabase), does nothing special.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    if (isSupabaseConfigured) {
      initialize();
    } else {
      // Mark as initialized immediately in demo mode
      useAuthStore.setState({ initialized: true });
    }
  }, [initialize]);

  if (!initialized && isSupabaseConfigured) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-slate-200 border-t-brand-600" />
          <p className="text-sm font-medium text-slate-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
