import { useRef, useState } from "react";
import { useDataContext } from "../context/DataContext";

export default function XlsxUploader() {
  const { loadFromXlsx, isUploading, uploadError, uploadInfo, resetToDefault } =
    useDataContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert("กรุณาเลือกไฟล์ .xlsx, .xls หรือ .csv เท่านั้น");
      return;
    }
    loadFromXlsx(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <h3 className="pdm-settings-h3">Upload ข้อมูล Excel</h3>

      {/* Drop zone */}
      <div
        className={`pdm-xlsx-drop${dragOver ? " drag-over" : ""}${isUploading ? " uploading" : ""}`}
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {isUploading ? (
          <div className="pdm-xlsx-state">
            <div className="pdm-xlsx-spinner" />
            <span>กำลังประมวลผล…</span>
          </div>
        ) : (
          <div className="pdm-xlsx-state">
            <span className="pdm-xlsx-icon">📊</span>
            <span className="pdm-xlsx-hint">
              วาง <strong>.xlsx</strong> หรือ <strong>.csv</strong> ที่นี่ หรือ{" "}
              <span className="pdm-xlsx-link">คลิกเพื่อเลือกไฟล์</span>
            </span>
            <span className="pdm-xlsx-sub">
              columns ที่ต้องการ: machineID, model, age, volt, rotate, pressure, vibration
              <br />
              (column underMaintenance ไม่บังคับ · daysToFailure คำนวณโดย XGBoost อัตโนมัติ)
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {uploadError && (
        <div className="pdm-xlsx-error">
          <strong>Upload ไม่สำเร็จ:</strong> {uploadError.message}
          {uploadError.detail && (
            <div style={{ marginTop: 4, fontSize: 11 }}>{uploadError.detail}</div>
          )}
        </div>
      )}

      {/* Success info */}
      {uploadInfo && !uploadError && (
        <div className="pdm-xlsx-success">
          <span>✓</span>
          <div style={{ flex: 1 }}>
            <strong>{uploadInfo.filename}</strong>
            <span style={{ marginLeft: 8, color: "var(--ink-muted)", fontSize: 12 }}>
              {uploadInfo.rowCount} machines · โหลดเมื่อ {uploadInfo.loadedAt}
            </span>
          </div>
          <button
            type="button"
            className="pdm-xlsx-reset"
            onClick={resetToDefault}
            title="กลับไปใช้ข้อมูล demo"
          >
            ✕ ล้างข้อมูล
          </button>
        </div>
      )}

      {/* Template download hint */}
      <p style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 8 }}>
        ดาวน์โหลด{" "}
        <span
          className="pdm-xlsx-link"
          style={{ cursor: "pointer" }}
          onClick={downloadTemplate}
        >
          template.xlsx
        </span>{" "}
        สำหรับรูปแบบไฟล์ที่ถูกต้อง
      </p>
    </div>
  );
}

function downloadTemplate() {
  // Build a tiny example CSV blob that opens as xlsx-compatible
  const header = "machineID,model,age,volt,rotate,pressure,vibration,underMaintenance";
  const rows = [
    "M001,model3,5,170.0,450.0,100.0,40.0,0",
    "M002,model1,10,165.0,420.0,105.0,42.0,1",
    "M003,model4,3,180.0,500.0,95.0,38.0,0",
  ];
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "template_machine_data.csv";
  a.click();
  URL.revokeObjectURL(url);
}
