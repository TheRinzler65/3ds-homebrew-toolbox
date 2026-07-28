import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";
export type Accent = "indigo" | "emerald" | "rose" | "amber" | "sky";

interface ThemeStore {
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "dark",
      accent: "indigo",
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    { name: "multitools-theme" }
  )
);

export const ACCENT_LABELS: Record<Accent, string> = {
  indigo: "Indigo",
  emerald: "Emerald",
  rose: "Rose",
  amber: "Amber",
  sky: "Sky",
};

export const ACCENT_COLORS: Record<Accent, { dark: string; light: string }> = {
  indigo: { dark: "#6366f1", light: "#4f46e5" },
  emerald: { dark: "#10b981", light: "#059669" },
  rose: { dark: "#f43f5e", light: "#e11d48" },
  amber: { dark: "#f59e0b", light: "#d97706" },
  sky: { dark: "#0ea5e9", light: "#0284c7" },
};
