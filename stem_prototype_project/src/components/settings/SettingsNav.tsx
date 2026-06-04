export type SettingsTab =
  | "profile" | "notifications" | "thresholds"
  | "display" | "team" | "data" | "about";

interface Props {
  active: SettingsTab;
  onSelect: (tab: SettingsTab) => void;
  dirtyTabs: Set<SettingsTab>;
}

const TABS: { key: SettingsTab; icon: string; label: string }[] = [
  { key: "profile",       icon: "👤", label: "Profile" },
  { key: "notifications", icon: "🔔", label: "Notifications" },
  { key: "thresholds",    icon: "📊", label: "Model Thresholds" },
  { key: "display",       icon: "🎨", label: "Display" },
  { key: "team",          icon: "👥", label: "Team & Roles" },
  { key: "data",          icon: "🔌", label: "Data Sources" },
  { key: "about",         icon: "📦", label: "About" },
];

export default function SettingsNav({ active, onSelect, dirtyTabs }: Props) {
  return (
    <nav className="pdm-settings-nav">
      {TABS.map((t) => {
        const isActive = active === t.key;
        const isDirty = dirtyTabs.has(t.key);
        return (
          <button
            key={t.key}
            type="button"
            className={"pdm-settings-tab" + (isActive ? " active" : "")}
            onClick={() => onSelect(t.key)}
          >
            <span className="pdm-settings-tab-icon">{t.icon}</span>
            <span className="pdm-settings-tab-label">{t.label}</span>
            {isDirty && <span className="pdm-settings-tab-dot" title="Unsaved changes" />}
            {isActive && <span className="pdm-settings-tab-caret">▶</span>}
          </button>
        );
      })}
    </nav>
  );
}
