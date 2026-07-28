import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/stores/themeStore";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  return <>{children}</>;
}
