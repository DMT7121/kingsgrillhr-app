import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "employee" | "manager" | "hr" | "admin" | "super_admin";

interface Profile {
  id: string;
  employee_id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (!isSupabaseConfigured) {
      // Demo mode — skip auth
      set({ initialized: true, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({ user: session.user, session });
        await get().fetchProfile(session.user.id);
      }
    } catch {
      // Silently fail in case Supabase is unreachable
    } finally {
      set({ loading: false, initialized: true });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ user: session?.user ?? null, session });
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) return { error: "Supabase chưa được cấu hình. Vui lòng điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local" };
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signUp: async (email, password, fullName) => {
    if (!isSupabaseConfigured) return { error: "Supabase chưa được cấu hình." };
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    set({ loading: false });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ user: null, session: null, profile: null });
  },

  fetchProfile: async (userId) => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, employee_id, email, full_name, avatar_url, role")
      .eq("id", userId)
      .single();
    if (data) {
      set({ profile: data as Profile });
    }
  },
}));
