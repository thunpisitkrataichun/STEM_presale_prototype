import { useState, useMemo } from "react";
import { useDataContext } from "../context/DataContext";
import {
  type MachinePrediction,
  statusFromDays,
  STATUS_COLOR,
} from "../../data/modelData";
import { predictDaysToFailure } from "../lib/predict";

type SortKey = keyof MachinePrediction;
type SortDir = "asc" | "desc";

const MODELS = ["model1", "model2", "model3", "model4"] as const;

type FormValues = Omit<MachinePrediction, "daysToFailure">;

const EMPTY_FORM: FormValues = {
  machineID: "",
  model: "model1",
  age: 5,
  volt: 170.0,
  rotate: 450.0,
  pressure: 100.0,
  vibration: 40.0,
  underMaintenance: false,
};

function computeDays(f: FormValues): number {
  return predictDaysToFailure({
    age: f.age,
    model: f.model,
    volt: f.volt,
    rotate: f.rotate,
    pressure: f.pressure,
    vibration: f.vibration,
    underMaintenance: f.underMaintenance,
  });
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "machineID",       label: "Machine ID" },
  { key: "model",           label: "Model" },
  { key: "age",             label: "Age (yr)" },
  { key: "volt",            label: "Volt" },
  { key: "rotate",          label: "Rotate" },
  { key: "pressure",        label: "Pressure" },
  { key: "vibration",       label: "Vibration" },
  { key: "underMaintenance",label: "Maint." },
  { key: "daysToFailure",   label: "Days to Fail" },
];

export default function DataManagement() {
  const { machines, addMachine, setMachines, deleteMachine } = useDataContext();

  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState<SortKey>("machineID");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const [modalMode, setModalMode]   = useState<"add" | "edit" | null>(null);
  const [editId, setEditId]         = useState<string | null>(null);
  const [form, setForm]             = useState<FormValues>(EMPTY_FORM);
  const [formError, setFormError]   = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? machines.filter(
          (m) =>
            m.machineID.toLowerCase().includes(q) ||
            m.model.toLowerCase().includes(q),
        )
      : machines;

    return [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (typeof av === "boolean" && typeof bv === "boolean") {
        cmp = Number(av) - Number(bv);
      } else if (typeof av === "string" && typeof bv === "string") {
        cmp = av.localeCompare(bv);
      } else {
        cmp = (av as number) - (bv as number);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [machines, search, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setEditId(null);
    setModalMode("add");
  }

  function openEdit(m: MachinePrediction) {
    const { daysToFailure: _, ...rest } = m;
    void _;
    setForm(rest);
    setFormError(null);
    setEditId(m.machineID);
    setModalMode("edit");
  }

  function closeModal() {
    setModalMode(null);
    setEditId(null);
  }

  function setField<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    const id = form.machineID.trim();
    if (!id) { setFormError("กรุณาใส่ Machine ID"); return; }

    if (modalMode === "add") {
      if (machines.some((m) => m.machineID === id)) {
        setFormError(`Machine ID "${id}" มีอยู่ในระบบแล้ว`);
        return;
      }
      addMachine({ ...form, machineID: id, daysToFailure: computeDays(form) });
    } else {
      setMachines(
        machines.map((m) =>
          m.machineID === editId
            ? { ...form, machineID: editId!, daysToFailure: computeDays(form) }
            : m,
        ),
      );
    }
    closeModal();
  }

  const previewDays = computeDays(form);
  const previewStatus = statusFromDays(previewDays);

  return (
    <main className="pdm-main">
      {/* Header */}
      <div className="pdm-top">
        <div>
          <h1 className="pdm-title">Data Management</h1>
          <p className="pdm-sub">
            จัดการข้อมูลเครื่องจักร — {machines.length} เครื่อง
          </p>
        </div>
        <button className="pdm-crud-add-btn" onClick={openAdd}>
          + เพิ่มเครื่องจักร
        </button>
      </div>

      {/* Toolbar */}
      <div className="pdm-crud-toolbar">
        <input
          className="pdm-crud-search"
          placeholder="ค้นหา Machine ID หรือ Model…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="pdm-crud-count">{filtered.length} รายการ</span>
      </div>

      {/* Table */}
      <div className="pdm-panel pdm-crud-table-wrap">
        <table className="pdm-crud-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={sortKey === col.key ? "pdm-crud-th-sorted" : ""}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="pdm-crud-sort-arrow">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
              <th className="pdm-crud-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const status = statusFromDays(m.daysToFailure);
              return (
                <tr key={m.machineID} className="pdm-crud-row">
                  <td><strong>{m.machineID}</strong></td>
                  <td>{m.model}</td>
                  <td>{m.age}</td>
                  <td>{m.volt.toFixed(1)}</td>
                  <td>{m.rotate.toFixed(1)}</td>
                  <td>{m.pressure.toFixed(1)}</td>
                  <td>{m.vibration.toFixed(1)}</td>
                  <td>
                    <span className={`pdm-crud-maint-badge ${m.underMaintenance ? "yes" : "no"}`}>
                      {m.underMaintenance ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="pdm-crud-days"
                      style={{ color: STATUS_COLOR[status] }}
                    >
                      {m.daysToFailure.toFixed(1)} d
                    </span>
                  </td>
                  <td>
                    <div className="pdm-crud-action-btns">
                      <button
                        className="pdm-crud-btn-edit"
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </button>
                      <button
                        className="pdm-crud-btn-delete"
                        onClick={() => setDeleteTarget(m.machineID)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="pdm-crud-empty">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="pdm-modal-backdrop" onClick={closeModal}>
          <div
            className="pdm-modal pdm-crud-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pdm-modal-head">
              <div>
                <div className="pdm-modal-title">
                  {modalMode === "add" ? "เพิ่มเครื่องจักรใหม่" : `แก้ไข ${editId}`}
                </div>
              </div>
              <button className="pdm-modal-btn pdm-modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            {formError && (
              <div className="pdm-modal-error" style={{ marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <div className="pdm-modal-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="pdm-modal-field">
                <label>Machine ID</label>
                <input
                  className="pdm-modal-input"
                  value={form.machineID}
                  onChange={(e) => setField("machineID", e.target.value)}
                  disabled={modalMode === "edit"}
                  placeholder="เช่น M101"
                />
              </div>

              <div className="pdm-modal-field">
                <label>Model</label>
                <select
                  className="pdm-modal-select"
                  value={form.model}
                  onChange={(e) => setField("model", e.target.value)}
                >
                  {MODELS.map((mo) => (
                    <option key={mo} value={mo}>{mo}</option>
                  ))}
                </select>
              </div>

              <div className="pdm-modal-field">
                <label>Age (years)</label>
                <input
                  className="pdm-modal-input"
                  type="number" min="0" max="30" step="1"
                  value={form.age}
                  onChange={(e) =>
                    setField("age", Math.max(0, parseFloat(e.target.value) || 0))
                  }
                />
              </div>

              <div className="pdm-modal-field">
                <label>Voltage (V)</label>
                <input
                  className="pdm-modal-input"
                  type="number" step="0.1"
                  value={form.volt}
                  onChange={(e) =>
                    setField("volt", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="pdm-modal-field">
                <label>Rotation (RPM)</label>
                <input
                  className="pdm-modal-input"
                  type="number" step="0.1"
                  value={form.rotate}
                  onChange={(e) =>
                    setField("rotate", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="pdm-modal-field">
                <label>Pressure</label>
                <input
                  className="pdm-modal-input"
                  type="number" step="0.1"
                  value={form.pressure}
                  onChange={(e) =>
                    setField("pressure", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="pdm-modal-field">
                <label>Vibration</label>
                <input
                  className="pdm-modal-input"
                  type="number" step="0.1"
                  value={form.vibration}
                  onChange={(e) =>
                    setField("vibration", parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="pdm-modal-field" style={{ justifyContent: "flex-end" }}>
                <label>Maintenance</label>
                <label className="pdm-modal-toggle">
                  <input
                    type="checkbox"
                    checked={form.underMaintenance}
                    onChange={(e) => setField("underMaintenance", e.target.checked)}
                  />
                  Under Maintenance
                </label>
              </div>
            </div>

            {/* Live prediction preview */}
            <div className="pdm-modal-prediction">
              <div>
                <div className="pdm-modal-prediction-label">Predicted Days to Failure</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
                  คำนวณโดย XGBoost model
                </div>
              </div>
              <div
                className="pdm-modal-prediction-val"
                style={{ color: STATUS_COLOR[previewStatus] }}
              >
                {previewDays.toFixed(1)}
                <span className="unit">days</span>
              </div>
            </div>

            <div className="pdm-modal-footer" style={{ marginTop: 16 }}>
              <button className="pdm-modal-btn pdm-modal-close" onClick={closeModal}>
                ยกเลิก
              </button>
              <button className="pdm-modal-btn pdm-modal-confirm" onClick={handleSave}>
                {modalMode === "add" ? "เพิ่ม" : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="pdm-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div
            className="pdm-modal"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pdm-modal-head">
              <div className="pdm-modal-title">ยืนยันการลบ</div>
              <button
                className="pdm-modal-btn pdm-modal-close"
                onClick={() => setDeleteTarget(null)}
              >
                ✕
              </button>
            </div>
            <p style={{ padding: "4px 0 20px", margin: 0, fontSize: 14, color: "var(--ink)" }}>
              ต้องการลบ <strong>{deleteTarget}</strong> ออกจากระบบหรือไม่?
              <br />
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                การลบนี้ไม่สามารถเรียกคืนได้
              </span>
            </p>
            <div className="pdm-modal-footer">
              <button
                className="pdm-modal-btn pdm-modal-close"
                onClick={() => setDeleteTarget(null)}
              >
                ยกเลิก
              </button>
              <button
                className="pdm-modal-btn pdm-crud-btn-del-confirm"
                onClick={() => { deleteMachine(deleteTarget); setDeleteTarget(null); }}
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
