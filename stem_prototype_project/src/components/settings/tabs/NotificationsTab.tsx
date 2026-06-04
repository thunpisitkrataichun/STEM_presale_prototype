import { useState } from "react";
import { type NotificationSettings } from "../../../../data/settingsData";

interface Props {
  value: NotificationSettings;
  onChange: (next: NotificationSettings) => void;
}

const EMAIL_OPTIONS: { key: keyof NotificationSettings["emailAlerts"]; label: string }[] = [
  { key: "critical",        label: "Critical machines (< 7 days to failure)" },
  { key: "maintenanceDue",  label: "Maintenance due tomorrow" },
  { key: "overdue",         label: "Overdue maintenance" },
  { key: "weeklySummary",   label: "Weekly fleet summary" },
  { key: "modelRetrain",    label: "Model retrain completed" },
];

const INAPP_OPTIONS: { key: keyof NotificationSettings["inAppAlerts"]; label: string }[] = [
  { key: "banner",  label: "Show banner for critical" },
  { key: "browser", label: "Browser notifications" },
  { key: "sound",   label: "Sound on alert" },
];

export default function NotificationsTab({ value, onChange }: Props) {
  const [newEmail, setNewEmail] = useState("");

  const toggleEmail = (k: keyof NotificationSettings["emailAlerts"]) =>
    onChange({
      ...value,
      emailAlerts: { ...value.emailAlerts, [k]: !value.emailAlerts[k] },
    });
  const toggleInApp = (k: keyof NotificationSettings["inAppAlerts"]) =>
    onChange({
      ...value,
      inAppAlerts: { ...value.inAppAlerts, [k]: !value.inAppAlerts[k] },
    });
  const removeRecipient = (i: number) =>
    onChange({
      ...value,
      recipients: value.recipients.filter((_, idx) => idx !== i),
    });
  const addRecipient = () => {
    const e = newEmail.trim();
    if (!e || !e.includes("@") || value.recipients.includes(e)) return;
    onChange({ ...value, recipients: [...value.recipients, e] });
    setNewEmail("");
  };

  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">Notifications</h2>
      <p className="pdm-settings-sub">Configure email and in-app alerts</p>

      <h3 className="pdm-settings-h3">Email Alerts</h3>
      <div className="pdm-toggle-list">
        {EMAIL_OPTIONS.map((o) => (
          <label key={o.key} className="pdm-toggle-row">
            <input
              type="checkbox"
              checked={value.emailAlerts[o.key]}
              onChange={() => toggleEmail(o.key)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>

      <h3 className="pdm-settings-h3">In-App Alerts</h3>
      <div className="pdm-toggle-list">
        {INAPP_OPTIONS.map((o) => (
          <label key={o.key} className="pdm-toggle-row">
            <input
              type="checkbox"
              checked={value.inAppAlerts[o.key]}
              onChange={() => toggleInApp(o.key)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>

      <h3 className="pdm-settings-h3">Alert Recipients</h3>
      <div className="pdm-recipient-list">
        {value.recipients.map((email, i) => (
          <div key={email} className="pdm-recipient-row">
            <span>{email}</span>
            <button
              type="button"
              className="pdm-page-btn"
              style={{ padding: "2px 8px", fontSize: 11 }}
              onClick={() => removeRecipient(i)}
            >×</button>
          </div>
        ))}
        <div className="pdm-recipient-row" style={{ background: "var(--blue-25)" }}>
          <input
            type="email"
            className="pdm-modal-input"
            placeholder="Add email..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipient(); } }}
            style={{ flex: 1, marginRight: 8 }}
          />
          <button
            type="button"
            className="pdm-page-btn"
            onClick={addRecipient}
            disabled={!newEmail.trim() || !newEmail.includes("@")}
          >+ Add</button>
        </div>
      </div>
    </div>
  );
}
