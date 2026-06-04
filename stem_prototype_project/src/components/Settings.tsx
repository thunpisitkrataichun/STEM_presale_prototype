import { useEffect, useMemo, useState } from "react";
import {
  type SettingsState, loadSettings, saveSettings,
} from "../../data/settingsData";

import SettingsNav, { type SettingsTab } from "./settings/SettingsNav";
import ProfileTab from "./settings/tabs/ProfileTab";
import NotificationsTab from "./settings/tabs/NotificationsTab";
import ThresholdsTab from "./settings/tabs/ThresholdsTab";
import DisplayTab from "./settings/tabs/DisplayTab";
import TeamRolesTab from "./settings/tabs/TeamRolesTab";
import DataSourcesTab from "./settings/tabs/DataSourcesTab";
import AboutTab from "./settings/tabs/AboutTab";

// Which top-level key under SettingsState belongs to which tab.
// `null` means the tab has no editable state (e.g. About).
const TAB_TO_KEY: Record<SettingsTab, keyof SettingsState | null> = {
  profile: "profile",
  notifications: "notifications",
  thresholds: "thresholds",
  display: "display",
  team: "team",
  data: "data",
  about: null,
};

export default function Settings() {
  // saved = last persisted snapshot; current = working copy in editors
  const [saved, setSaved] = useState<SettingsState>(() => loadSettings());
  const [current, setCurrent] = useState<SettingsState>(saved);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Per-tab dirty detection by comparing relevant slice JSON
  const dirtyTabs = useMemo<Set<SettingsTab>>(() => {
    const result = new Set<SettingsTab>();
    for (const tab of Object.keys(TAB_TO_KEY) as SettingsTab[]) {
      const key = TAB_TO_KEY[tab];
      if (!key) continue;
      if (JSON.stringify(current[key]) !== JSON.stringify(saved[key])) {
        result.add(tab);
      }
    }
    return result;
  }, [current, saved]);

  const activeDirty = dirtyTabs.has(activeTab);

  const handleSave = () => {
    setSaved(current);
    saveSettings(current);
    setToast("✓ Settings saved");
  };
  const handleDiscard = () => {
    setCurrent(saved);
    setToast("Changes discarded");
  };

  // Per-slice update handlers passed into each tab
  const updateSlice = <K extends keyof SettingsState>(key: K, next: SettingsState[K]) =>
    setCurrent((c) => ({ ...c, [key]: next }));

  let body: React.ReactNode = null;
  switch (activeTab) {
    case "profile":
      body = <ProfileTab value={current.profile} onChange={(v) => updateSlice("profile", v)} />;
      break;
    case "notifications":
      body = <NotificationsTab value={current.notifications} onChange={(v) => updateSlice("notifications", v)} />;
      break;
    case "thresholds":
      body = <ThresholdsTab value={current.thresholds} onChange={(v) => updateSlice("thresholds", v)} />;
      break;
    case "display":
      body = <DisplayTab value={current.display} onChange={(v) => updateSlice("display", v)} />;
      break;
    case "team":
      body = <TeamRolesTab value={current.team} onChange={(v) => updateSlice("team", v)} />;
      break;
    case "data":
      body = <DataSourcesTab value={current.data} onChange={(v) => updateSlice("data", v)} />;
      break;
    case "about":
      body = <AboutTab />;
      break;
  }

  return (
    <main className="pdm-main">
      <div className="pdm-top">
        <div>
          <h1 className="pdm-title">Settings</h1>
          <p className="pdm-sub">
            Configure dashboard preferences, notifications &amp; model thresholds
          </p>
        </div>
        {dirtyTabs.size > 0 && (
          <span className="pdm-pill" style={{
            background: "#fcf2e0", borderColor: "#e8a33d", color: "#9c6b1e",
          }}>
            {dirtyTabs.size} tab{dirtyTabs.size > 1 ? "s" : ""} with unsaved changes
          </span>
        )}
      </div>

      <div className="pdm-settings-layout">
        <SettingsNav active={activeTab} onSelect={setActiveTab} dirtyTabs={dirtyTabs} />
        <div className="pdm-settings-content">
          {body}

          {activeTab !== "about" && (
            <div className="pdm-modal-footer" style={{
              marginTop: 18, paddingTop: 14,
              borderTop: "1px solid var(--line)",
            }}>
              <button
                type="button"
                className="pdm-modal-btn pdm-modal-close"
                disabled={!activeDirty}
                onClick={handleDiscard}
              >
                Discard
              </button>
              <button
                type="button"
                className="pdm-modal-btn pdm-modal-confirm"
                disabled={!activeDirty}
                onClick={handleSave}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="pdm-toast">{toast}</div>
      )}
    </main>
  );
}
