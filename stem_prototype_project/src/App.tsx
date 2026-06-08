import { useState } from "react";
import Sidebar, { type PageKey } from "./components/Sidebar";
import Overview from "./components/Overview";
import Maintenance from "./components/Maintenance";
import FailureAnalysis from "./components/FailureAnalysis";
import LiveMonitor from "./components/LiveMonitor";
import Settings from "./components/Settings";
import { DataContextProvider } from "./context/DataContext";
import "./styles/pdm-theme.css";

export default function App() {
  const [page, setPage] = useState<PageKey>("overview");

  return (
    <DataContextProvider>
      <div className="pdm-shell">
        <Sidebar active={page} onNavigate={setPage} />
        {page === "overview" && <Overview />}
        {page === "live" && <LiveMonitor />}
        {page === "failure" && <FailureAnalysis />}
        {page === "maintenance" && <Maintenance />}
        {page === "settings" && <Settings />}
      </div>
    </DataContextProvider>
  );
}
