import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const accent = useThemeStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.dataset.theme = accent;
  }, [theme, accent]);

  return <>{children}</>;
}
