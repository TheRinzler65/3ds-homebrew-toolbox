import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";
import { useThemeStore } from "@/stores/themeStore";

export function AppLayout() {
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Toaster
        theme={theme === "dark" ? "dark" : "light"}
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          },
        }}
      />
    </div>
  );
}
