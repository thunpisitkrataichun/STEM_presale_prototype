import { useState } from "react";
import { type TeamSettings, type TeamMember, ROLES } from "../../../../data/settingsData";

interface Props {
  value: TeamSettings;
  onChange: (next: TeamSettings) => void;
}

export default function TeamRolesTab({ value, onChange }: Props) {
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [draft, setDraft] = useState<TeamMember>({
    id: "", name: "", specialty: "", email: "",
  });

  const startAdd = () => {
    setDraft({
      id: `T${String(value.members.length + 1).padStart(2, "0")}`,
      name: "", specialty: "General", email: "",
    });
    setEditing({ id: "", name: "", specialty: "", email: "" }); // sentinel for add
  };

  const startEdit = (m: TeamMember) => {
    setDraft({ ...m });
    setEditing(m);
  };

  const saveDraft = () => {
    if (!draft.name.trim() || !draft.email.trim()) return;
    if (editing?.id) {
      onChange({
        ...value,
        members: value.members.map((m) => m.id === editing.id ? draft : m),
      });
    } else {
      onChange({ ...value, members: [...value.members, draft] });
    }
    setEditing(null);
  };

  const removeMember = (id: string) => {
    onChange({ ...value, members: value.members.filter((m) => m.id !== id) });
  };

  return (
    <div className="pdm-settings-panel">
      <h2 className="pdm-settings-h">Team &amp; Roles</h2>
      <p className="pdm-settings-sub">Technicians available for maintenance scheduling</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 className="pdm-settings-h3" style={{ margin: 0 }}>Technicians</h3>
        <button
          type="button"
          className="pdm-modal-btn pdm-modal-confirm"
          onClick={startAdd}
          disabled={editing !== null}
        >+ Add Technician</button>
      </div>

      <table className="pdm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Specialty</th>
            <th>Email</th>
            <th style={{ width: 100 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {value.members.map((m) => (
            <tr key={m.id}>
              <td style={{ fontWeight: 600 }}>{m.name}</td>
              <td>{m.specialty}</td>
              <td style={{ color: "var(--ink-muted)" }}>{m.email}</td>
              <td>
                <button
                  type="button"
                  className="pdm-page-btn"
                  style={{ padding: "3px 8px", fontSize: 11, marginRight: 4 }}
                  onClick={() => startEdit(m)}
                >Edit</button>
                <button
                  type="button"
                  className="pdm-page-btn"
                  style={{ padding: "3px 8px", fontSize: 11, color: "var(--risk-critical)" }}
                  onClick={() => removeMember(m.id)}
                >×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing !== null && (
        <div className="pdm-edit-card">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {editing.id ? `Edit · ${editing.id}` : "New Technician"}
          </div>
          <div className="pdm-settings-grid">
            <div className="pdm-form-field">
              <label>Name</label>
              <input
                className="pdm-modal-input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="pdm-form-field">
              <label>Specialty</label>
              <input
                className="pdm-modal-input"
                value={draft.specialty}
                onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}
              />
            </div>
            <div className="pdm-form-field pdm-form-field-full">
              <label>Email</label>
              <input
                type="email"
                className="pdm-modal-input"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
          </div>
          <div className="pdm-modal-footer" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="pdm-modal-btn pdm-modal-close"
              onClick={() => setEditing(null)}
            >Cancel</button>
            <button
              type="button"
              className="pdm-modal-btn pdm-modal-confirm"
              onClick={saveDraft}
              disabled={!draft.name.trim() || !draft.email.trim()}
            >Save</button>
          </div>
        </div>
      )}

      <h3 className="pdm-settings-h3">Roles</h3>
      <div className="pdm-role-list">
        {ROLES.map((r) => (
          <div key={r.value} className="pdm-role-row">
            <span className="pdm-led" style={{ background: "var(--blue-500)" }} />
            <span style={{ fontWeight: 600, color: "var(--ink)" }}>{r.label}</span>
            <span style={{ color: "var(--ink-muted)", fontSize: 12 }}>— {r.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
