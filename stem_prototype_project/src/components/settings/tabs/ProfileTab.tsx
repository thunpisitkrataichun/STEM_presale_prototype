import { type ProfileSettings, ROLES, type Language, type Role } from "../../../../data/settingsData";

interface Props {
  value: ProfileSettings;
  onChange: (next: ProfileSettings) => void;
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
}

export default function ProfileTab({ value, onChange }: Props) {
  const update = <K extends keyof ProfileSettings>(k: K, v: ProfileSettings[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">Profile</h2>
      <p className="pdm-settings-sub">Personal info and language preference</p>

      <div className="pdm-profile-head">
        <div className="pdm-avatar">{initials(value.displayName)}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
            {value.displayName}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>
            {ROLES.find((r) => r.value === value.role)?.label}
          </div>
        </div>
      </div>

      <div className="pdm-settings-grid">
        <div className="pdm-form-field">
          <label>Display Name</label>
          <input
            className="pdm-modal-input"
            value={value.displayName}
            onChange={(e) => update("displayName", e.target.value)}
          />
        </div>

        <div className="pdm-form-field">
          <label>Email</label>
          <input
            type="email"
            className="pdm-modal-input"
            value={value.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </div>

        <div className="pdm-form-field">
          <label>Role</label>
          <select
            className="pdm-modal-select"
            value={value.role}
            onChange={(e) => update("role", e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.description}
              </option>
            ))}
          </select>
        </div>

        <div className="pdm-form-field">
          <label>Language</label>
          <div className="pdm-radio-row">
            {(["en", "th"] as Language[]).map((lang) => (
              <label key={lang} className="pdm-radio">
                <input
                  type="radio"
                  name="lang"
                  checked={value.language === lang}
                  onChange={() => update("language", lang)}
                />
                {lang === "en" ? "English" : "ไทย"}
              </label>
            ))}
          </div>
        </div>

        <div className="pdm-form-field pdm-form-field-full">
          <label>Password</label>
          <button type="button" className="pdm-page-btn" style={{ alignSelf: "flex-start" }}>
            Change Password ▶
          </button>
        </div>
      </div>
    </div>
  );
}
