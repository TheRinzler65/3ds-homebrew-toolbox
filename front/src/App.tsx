import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import HomePage from "@/pages/Home";
import NDSForwarderPage from "@/pages/NDSForwarder";
import ROMToolsPage from "@/pages/ROMTools";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tools/nds-forwarder" element={<NDSForwarderPage />} />
            <Route path="/tools/rom-manager" element={<ROMToolsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
