import { useState } from "react";
import {
  IconDashboard, IconActivity, IconAlert,
  IconMicroscope, IconCalendar, IconSettings, IconDatabase,
} from "./icons";

export type PageKey = "overview" | "live" | "anomaly" | "failure" | "maintenance" | "data" | "settings";

interface NavItem {
  key: PageKey;
  label: string;
  icon: React.ReactNode;
  soon?: boolean;
}

const NAV: NavItem[] = [
  { key: "overview",    label: "Overview",         icon: <IconDashboard /> },
  { key: "live",        label: "Live Monitor",     icon: <IconActivity /> },
  { key: "anomaly",     label: "Anomaly",          icon: <IconAlert />, soon: true },
  { key: "failure",     label: "Failure Analysis", icon: <IconMicroscope /> },
  { key: "maintenance", label: "Maintenance",      icon: <IconCalendar /> },
  { key: "data",        label: "Data Management",  icon: <IconDatabase /> },
  { key: "settings",    label: "Settings",         icon: <IconSettings /> },
];

// STEM logo recreation (fallback ถ้าไม่มีไฟล์ ./logo.png)
function StemLogoFallback() {
  // viewBox is wider than 124 so the italic "STEM" text fits without clipping.
  return (
    <svg
      width="150" height="60" viewBox="0 0 150 60"
      xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="STEM logo"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <polygon points="38,8 70,54 6,54" fill="none" stroke="#1f9e54" strokeWidth="5" strokeLinejoin="round" />
      <text x="54" y="42" fontFamily="Georgia, serif" fontSize="26" fontWeight="700" fontStyle="italic" fill="#23439c">STEM</text>
    </svg>
  );
}

interface SidebarProps {
  active: PageKey;
  onNavigate: (page: PageKey) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <aside className="pdm-side">
      <div className="pdm-logobox">
        {logoOk ? (
          // วาง logo จริงไว้ที่ public/logo.png — ถ้าไม่เจอจะ fallback เป็น SVG
          <img
            src="./logo.png"
            alt="STEM"
            style={{
              display: "block",
              margin: "0 auto",
              maxWidth: "100%",
              maxHeight: "60px",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
            onError={() => setLogoOk(false)}
          />
        ) : (
          <StemLogoFallback />
        )}
        <div className="pdm-logo-cap">Predictive Maintenance System</div>
        <div className="pdm-company">
          Sango Thai Engineering<br />&amp; Manufacturing Co., Ltd.
        </div>
      </div>

      <nav className="pdm-navwrap">
        {NAV.map((item) => (
          <button
            key={item.key}
            className={
              "pdm-nav" +
              (item.key === active ? " active" : "") +
              (item.soon ? " soon" : "")
            }
            onClick={() => !item.soon && onNavigate(item.key)}
            disabled={item.soon}
          >
            {item.icon}
            {item.label}
            {item.soon && <span className="pdm-soon-badge">Soon</span>}
          </button>
        ))}
        <div className="pdm-side-foot">
          Model: XGBoost<br />MAE 17 Days
        </div>
      </nav>
    </aside>
  );
}
