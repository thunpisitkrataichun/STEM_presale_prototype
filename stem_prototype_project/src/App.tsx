import { useState } from "react";
import Sidebar, { type PageKey } from "./components/Sidebar";
import Overview from "./components/Overview";
import Maintenance from "./components/Maintenance";
import FailureAnalysis from "./components/FailureAnalysis";
import Settings from "./components/Settings";
import "./styles/pdm-theme.css";

// placeholder สำหรับหน้าที่ยังไม่ทำ
function Placeholder({ title }: { title: string }) {
  return (
    <main className="pdm-main">
      <h1 className="pdm-title">{title}</h1>
      <p className="pdm-sub">หน้านี้กำลังพัฒนา — ต่อจาก Overview</p>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<PageKey>("overview");

  return (
    <div className="pdm-shell">
      <Sidebar active={page} onNavigate={setPage} />
      {page === "overview" && <Overview />}
      {page === "live" && <Placeholder title="Live Monitor" />}
      {page === "failure" && <FailureAnalysis />}
      {page === "maintenance" && <Maintenance />}
      {page === "settings" && <Settings />}
    </div>
  );
}
