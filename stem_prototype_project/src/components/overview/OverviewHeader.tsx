import { LAST_SYNC } from "../../../data/modelData";
import { useDataContext } from "../../context/DataContext";

export default function OverviewHeader() {
  const { uploadInfo } = useDataContext();

  return (
    <div className="pdm-top">
      <div>
        <h1 className="pdm-title">Overview</h1>
        <p className="pdm-sub">Fleet Health &amp; Remaining Useful Life</p>
      </div>
      {uploadInfo ? (
        <span className="pdm-pill" style={{ background: "#eefaf3", color: "#1c7a4e", borderColor: "#8fe0b4" }}>
          📊 {uploadInfo.filename} · {uploadInfo.rowCount} Machines
        </span>
      ) : (
        <span className="pdm-pill">
          100 Machines · Last Sync {LAST_SYNC}
        </span>
      )}
    </div>
  );
}
