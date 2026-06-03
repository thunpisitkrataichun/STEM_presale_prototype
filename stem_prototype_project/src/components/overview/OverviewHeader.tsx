import { TOTAL_MACHINES, LAST_SYNC } from "../../../data/modelData";

export default function OverviewHeader() {
  return (
    <div className="pdm-top">
      <div>
        <h1 className="pdm-title">Overview</h1>
        <p className="pdm-sub">Fleet Health &amp; Remaining Useful Life</p>
      </div>
      <span className="pdm-pill">
        {TOTAL_MACHINES} Machines · Last Sync {LAST_SYNC}
      </span>
    </div>
  );
}
