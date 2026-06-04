import { TOTAL_MACHINES, LAST_SYNC } from "../../../data/modelData";

export default function MaintenanceHeader() {
  return (
    <div className="pdm-top">
      <div>
        <h1 className="pdm-title">Maintenance</h1>
        <p className="pdm-sub">Plan &amp; track scheduled servicing for the fleet</p>
      </div>
      <span className="pdm-pill">
        {TOTAL_MACHINES} Machines · Last Sync {LAST_SYNC}
      </span>
    </div>
  );
}
