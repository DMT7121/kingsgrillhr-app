"use client";

import { useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";

export default function RealtimeProvider() {
  const { profile } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.employee_id) return;

    // Lắng nghe thông báo mới từ bảng notifications (dành cho chính mình)
    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `employee_id=eq.${profile.employee_id}`,
        },
        (payload) => {
          const newNotification = payload.new;
          addToast({
            title: newNotification.title || "Có thông báo mới",
            message: newNotification.body,
            type: "info",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.employee_id, addToast]);

  return null;
}
