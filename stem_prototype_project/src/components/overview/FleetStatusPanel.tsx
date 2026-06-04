import { type MachinePrediction } from "../../../data/modelData";
import ModelBadge from "./ModelBadge";
import FleetStatusPie from "./FleetStatusPie";

export default function FleetStatusPanel({ machines }: { machines: MachinePrediction[] }) {
  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">
            Fleet Health Status <ModelBadge inline />
          </span>
          <div className="pdm-phead-sub">Distribution across {machines.length} machines</div>
        </div>
      </div>
      <FleetStatusPie machines={machines} />
    </div>
  );
}
