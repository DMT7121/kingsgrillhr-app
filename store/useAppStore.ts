import { create } from "zustand";

export type AppRole = "employee" | "manager" | "hr" | "admin";

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  currentUser: {
    id: string;
    name: string;
    code: string;
    department: string;
    position: string;
    avatar: string | null;
    role: AppRole;
  };
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentRole: "admin",
  setCurrentRole: (role) =>
    set((s) => ({ currentRole: role, currentUser: { ...s.currentUser, role } })),
  currentUser: {
    id: "emp-001",
    name: "Nguyễn Minh Anh",
    code: "NV001",
    department: "Nhân sự",
    position: "HR Manager",
    avatar: null,
    role: "admin",
  },
}));
